import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { DEFAULT_NETWORK, LOCALNET_URL, requireFrontendConfig, } from '@/config/constants';
const EVENT_LIMIT = 80;
const DEFAULT_PAGE_SIZE = 20;
const decoder = new TextDecoder();
const getEventTypes = (packageId) => ({
    bountyCreated: `${packageId}::bounty_registry::BountyCreatedEvent`,
    bountyCancelled: `${packageId}::bounty_registry::BountyCancelledEvent`,
    bountyExpired: `${packageId}::bounty_registry::BountyExpiredEvent`,
    bountyClaimed: `${packageId}::bounty_registry::BountyClaimedEvent`,
    bountyVerified: `${packageId}::bounty_verify::BountyVerifiedEvent`,
    hunterRegistered: `${packageId}::bounty_registry::HunterRegisteredEvent`,
    killProofIssued: `${packageId}::bounty_verify::KillProofIssuedEvent`,
});
const client = new SuiClient({
    url: DEFAULT_NETWORK === 'localnet' ? LOCALNET_URL : getFullnodeUrl(DEFAULT_NETWORK),
});
const asNumber = (value, fallback = 0) => {
    if (typeof value === 'number')
        return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
};
const asString = (value, fallback = '') => typeof value === 'string' ? value : fallback;
const asNullableString = (value) => {
    if (typeof value === 'string' && value.length > 0)
        return value;
    return null;
};
const normalizeAddress = (value) => value.toLowerCase();
const decodeBytes = (value) => {
    if (!Array.isArray(value))
        return null;
    const bytes = value.filter((item) => typeof item === 'number');
    return decoder.decode(Uint8Array.from(bytes));
};
const bytesToHex = (value) => {
    if (!Array.isArray(value))
        return null;
    const bytes = value.filter((item) => typeof item === 'number');
    return `0x${bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
};
const readFields = (object) => {
    const fields = object.data?.content;
    if (!fields || fields.dataType !== 'moveObject') {
        return null;
    }
    return fields.fields;
};
const eventPayload = (event) => (event.parsedJson ?? {});
const parseBounty = (object, txDigest = 'direct-chain') => {
    const fields = readFields(object);
    if (!fields)
        return null;
    return {
        id: asString(fields.id?.id),
        creator: asString(fields.creator),
        target: asString(fields.target),
        rewardAmount: asNumber(fields.reward_amount),
        status: asNumber(fields.status),
        description: decodeBytes(fields.description),
        createdAt: asNumber(fields.created_at),
        expiresAt: asNumber(fields.expires_at),
        claimedBy: asNullableString(fields.claimed_by),
        claimedAt: fields.claimed_at === null || fields.claimed_at === undefined
            ? null
            : asNumber(fields.claimed_at),
        txDigest,
        updatedAt: fields.claimed_at === null || fields.claimed_at === undefined
            ? asNumber(fields.created_at)
            : asNumber(fields.claimed_at),
    };
};
const parseHunterBadge = (object, rank = 0) => {
    const fields = readFields(object);
    if (!fields)
        return null;
    return {
        address: asString(fields.hunter),
        badgeId: asString(fields.id?.id),
        kills: asNumber(fields.kills),
        totalEarnings: asNumber(fields.total_earnings),
        streak: asNumber(fields.streak),
        maxStreak: asNumber(fields.max_streak),
        rank,
        lastKillAt: fields.last_kill_at === null || fields.last_kill_at === undefined
            ? null
            : asNumber(fields.last_kill_at),
    };
};
const sortBounties = (items, filter) => {
    const sortBy = filter.sortBy ?? 'created_at';
    const sortOrder = filter.sortOrder ?? 'desc';
    const factor = sortOrder === 'asc' ? 1 : -1;
    return [...items].sort((left, right) => {
        const a = sortBy === 'reward_amount'
            ? left.rewardAmount
            : sortBy === 'expires_at'
                ? left.expiresAt
                : left.createdAt;
        const b = sortBy === 'reward_amount'
            ? right.rewardAmount
            : sortBy === 'expires_at'
                ? right.expiresAt
                : right.createdAt;
        return (a - b) * factor;
    });
};
const recentEventsForType = async (type, limit) => {
    const page = await client.queryEvents({
        query: { MoveEventType: type },
        limit,
        order: 'descending',
    });
    return page.data;
};
const recentEventsUntilMatch = async (type, predicate, pageSize = 40, pageBudget = 4) => {
    let cursor = null;
    let pages = 0;
    while (pages < pageBudget) {
        const page = await client.queryEvents({
            query: { MoveEventType: type },
            cursor,
            limit: pageSize,
            order: 'descending',
        });
        const match = page.data.find(predicate);
        if (match)
            return match;
        if (!page.hasNextPage || !page.nextCursor)
            return null;
        cursor = page.nextCursor;
        pages += 1;
    }
    return null;
};
const loadCreationTxDigest = async (bountyId, bountyCreatedType) => {
    const event = await recentEventsUntilMatch(bountyCreatedType, (candidate) => {
        const payload = eventPayload(candidate);
        return payload.bounty_id === bountyId;
    });
    return event?.id.txDigest ?? 'direct-chain';
};
const fetchBoardFields = async (boardId) => {
    const board = await client.getObject({
        id: boardId,
        options: { showContent: true, showType: true, showOwner: true },
    });
    return readFields(board) ?? {};
};
const fetchClaimRegistryFields = async (claimRegistryId) => {
    const registry = await client.getObject({
        id: claimRegistryId,
        options: { showContent: true, showType: true, showOwner: true },
    });
    return readFields(registry) ?? {};
};
const fetchBountyObjects = async (ids, bountyCreatedType) => {
    if (ids.length === 0)
        return [];
    const results = await client.multiGetObjects({
        ids,
        options: { showContent: true, showType: true, showOwner: true },
    });
    const createEventMap = new Map();
    const createdEvents = await recentEventsForType(bountyCreatedType, Math.min(EVENT_LIMIT, Math.max(ids.length * 3, 12)));
    for (const event of createdEvents) {
        const payload = eventPayload(event);
        const bountyId = asString(payload.bounty_id);
        if (bountyId) {
            createEventMap.set(bountyId, event.id.txDigest);
        }
    }
    return results
        .map((item) => parseBounty(item, createEventMap.get(item.data?.objectId ?? '') ?? 'direct-chain'))
        .filter((item) => Boolean(item));
};
const filterBounties = (items, filter) => {
    return items.filter((item) => {
        if (filter.status !== undefined && item.status !== filter.status)
            return false;
        if (filter.target && normalizeAddress(item.target) !== normalizeAddress(filter.target))
            return false;
        if (filter.creator && normalizeAddress(item.creator) !== normalizeAddress(filter.creator))
            return false;
        return true;
    });
};
const mapClaimEvent = (event) => {
    const payload = eventPayload(event);
    return {
        id: `${event.id.txDigest}:${event.id.eventSeq}`,
        bountyId: asString(payload.bounty_id),
        hunter: asString(payload.hunter),
        target: asString(payload.target),
        rewardAmount: asNumber(payload.reward_amount),
        claimedAt: asNumber(event.timestampMs),
        txDigest: event.id.txDigest,
        solarSystemId: payload.solar_system_id ? asNumber(payload.solar_system_id) : null,
        killDigest: bytesToHex(payload.kill_digest),
    };
};
class ChainDataService {
    async getBounties(filter = {}) {
        const config = requireFrontendConfig();
        const eventTypes = getEventTypes(config.packageId);
        const pageSize = filter.pageSize ?? DEFAULT_PAGE_SIZE;
        const page = filter.page ?? 1;
        const createdEvents = await recentEventsForType(eventTypes.bountyCreated, Math.max(EVENT_LIMIT, pageSize * 4));
        const candidateIds = createdEvents
            .filter((event) => {
            const payload = eventPayload(event);
            if (filter.creator && normalizeAddress(asString(payload.creator)) !== normalizeAddress(filter.creator)) {
                return false;
            }
            if (filter.target && normalizeAddress(asString(payload.target)) !== normalizeAddress(filter.target)) {
                return false;
            }
            return true;
        })
            .map((event) => asString(eventPayload(event).bounty_id))
            .filter(Boolean);
        const uniqueIds = [...new Set(candidateIds)];
        const bounties = filterBounties(await fetchBountyObjects(uniqueIds, eventTypes.bountyCreated), filter);
        const sorted = sortBounties(bounties, filter);
        const start = Math.max(page - 1, 0) * pageSize;
        return sorted.slice(start, start + pageSize);
    }
    async getBounty(id) {
        const config = requireFrontendConfig();
        const eventTypes = getEventTypes(config.packageId);
        const [object, txDigest] = await Promise.all([
            client.getObject({
                id,
                options: { showContent: true, showType: true, showOwner: true },
            }),
            loadCreationTxDigest(id, eventTypes.bountyCreated),
        ]);
        const bounty = parseBounty(object, txDigest);
        if (!bounty) {
            throw new Error(`Bounty ${id} was not found on chain.`);
        }
        return bounty;
    }
    async getHunter(address) {
        const config = requireFrontendConfig();
        const objects = await client.getOwnedObjects({
            owner: address,
            filter: {
                StructType: `${config.packageId}::bounty_registry::HunterBadge`,
            },
            options: { showContent: true, showType: true, showOwner: true },
            limit: 20,
        });
        const badges = objects.data
            .map((item) => parseHunterBadge(item))
            .filter((item) => Boolean(item))
            .sort((left, right) => {
            if ((right.lastKillAt ?? 0) !== (left.lastKillAt ?? 0)) {
                return (right.lastKillAt ?? 0) - (left.lastKillAt ?? 0);
            }
            if (right.kills !== left.kills) {
                return right.kills - left.kills;
            }
            return right.totalEarnings - left.totalEarnings;
        });
        if (badges.length === 0) {
            return null;
        }
        const leaderboard = await this.getLeaderboard(50);
        const rank = leaderboard.find((entry) => normalizeAddress(entry.address) === normalizeAddress(address))?.rank ?? 0;
        return { ...badges[0], rank };
    }
    async getLeaderboard(limit = 50) {
        const config = requireFrontendConfig();
        const eventTypes = getEventTypes(config.packageId);
        const [registeredEvents, claimEvents] = await Promise.all([
            recentEventsForType(eventTypes.hunterRegistered, Math.max(limit * 2, 40)),
            recentEventsForType(eventTypes.bountyVerified, Math.max(limit * 3, 60)),
        ]);
        const hunterMap = new Map();
        for (const event of registeredEvents) {
            const payload = eventPayload(event);
            const address = asString(payload.hunter);
            if (!address)
                continue;
            if (!hunterMap.has(address)) {
                hunterMap.set(address, {
                    address,
                    badgeId: asString(payload.badge_id),
                    kills: 0,
                    totalEarnings: 0,
                    streak: 0,
                    maxStreak: 0,
                    rank: 0,
                    lastKillAt: null,
                });
            }
        }
        for (const event of claimEvents) {
            const payload = eventPayload(event);
            const hunter = asString(payload.hunter);
            if (!hunter)
                continue;
            const current = hunterMap.get(hunter) ?? {
                address: hunter,
                badgeId: null,
                kills: 0,
                totalEarnings: 0,
                streak: 0,
                maxStreak: 0,
                rank: 0,
                lastKillAt: null,
            };
            current.kills += 1;
            current.totalEarnings += asNumber(payload.reward_amount);
            current.streak = Math.max(current.streak, current.kills);
            current.maxStreak = Math.max(current.maxStreak, current.kills);
            current.lastKillAt = asNumber(event.timestampMs);
            hunterMap.set(hunter, current);
        }
        return [...hunterMap.values()]
            .sort((left, right) => {
            if (right.kills !== left.kills)
                return right.kills - left.kills;
            if (right.totalEarnings !== left.totalEarnings)
                return right.totalEarnings - left.totalEarnings;
            return (right.lastKillAt ?? 0) - (left.lastKillAt ?? 0);
        })
            .slice(0, limit)
            .map((hunter, index) => ({ ...hunter, rank: index + 1 }));
    }
    async getRecentClaims(limit = 20) {
        const config = requireFrontendConfig();
        const eventTypes = getEventTypes(config.packageId);
        const events = await recentEventsForType(eventTypes.bountyVerified, limit);
        return events.map(mapClaimEvent);
    }
    async getStats() {
        const config = requireFrontendConfig();
        const [boardFields, claimRegistryFields, bountyList, leaderboard] = await Promise.all([
            fetchBoardFields(config.bountyBoardId),
            fetchClaimRegistryFields(config.claimRegistryId),
            this.getBounties({ pageSize: 12, sortBy: 'reward_amount', sortOrder: 'desc' }),
            this.getLeaderboard(1),
        ]);
        const usedProofs = claimRegistryFields.used_proofs;
        const targetRewardTable = boardFields.target_total_active_reward;
        return {
            activeBounties: asNumber(boardFields.active_count),
            totalBounties: asNumber(boardFields.total_bounties_created),
            totalRewardsPaid: asNumber(boardFields.total_rewards_paid),
            totalClaims: asNumber(usedProofs?.fields?.size),
            wantedTargets: asNumber(targetRewardTable?.fields?.size),
            topHunter: leaderboard[0]?.address ?? null,
            topReward: bountyList[0]?.rewardAmount ?? 0,
        };
    }
    async getRecentEvents(limit = 20) {
        const config = requireFrontendConfig();
        const eventTypes = getEventTypes(config.packageId);
        const perType = Math.max(Math.ceil(limit / 3), 6);
        const pages = await Promise.all([
            recentEventsForType(eventTypes.bountyCreated, perType),
            recentEventsForType(eventTypes.bountyVerified, perType),
            recentEventsForType(eventTypes.hunterRegistered, perType),
            recentEventsForType(eventTypes.bountyCancelled, Math.max(2, Math.floor(perType / 2))),
            recentEventsForType(eventTypes.bountyExpired, Math.max(2, Math.floor(perType / 2))),
        ]);
        return pages
            .flat()
            .map((event) => ({
            id: `${event.id.txDigest}:${event.id.eventSeq}`,
            eventType: event.type,
            txDigest: event.id.txDigest,
            payload: eventPayload(event),
            createdAt: asNumber(event.timestampMs),
        }))
            .sort((left, right) => right.createdAt - left.createdAt)
            .slice(0, limit);
    }
}
export const chainDataService = new ChainDataService();
