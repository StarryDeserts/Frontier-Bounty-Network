import type { DatabaseSync } from 'node:sqlite';

import {
  BOUNTY_STATUS,
  type Bounty,
  type BountyStatus,
  type Claim,
  type EventCheckpoint,
  type EventEnvelope,
  type Hunter,
  type IndexedEvent,
  type StatsSnapshot,
} from '../types.js';
import { nowMs } from '../utils.js';

export interface BountyListFilter {
  status?: number;
  target?: string;
  creator?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'reward_amount' | 'expires_at';
  sortOrder?: 'asc' | 'desc';
}

const isUniqueConstraintError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('UNIQUE') || message.includes('constraint failed');
};

export class IndexerRepository {
  constructor(private readonly db: DatabaseSync) {}

  withTransaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const result = fn();
      this.db.exec('COMMIT;');
      return result;
    } catch (error) {
      try {
        this.db.exec('ROLLBACK;');
      } catch {
        // Ignore rollback errors so the original failure is preserved.
      }
      throw error;
    }
  }

  getEventCheckpoint(packageId: string, eventType: string): EventCheckpoint | null {
    const row = this.db
      .prepare(`
        SELECT package_id, event_type, tx_digest, event_seq, updated_at
        FROM event_checkpoints
        WHERE package_id = ? AND event_type = ?
        LIMIT 1
      `)
      .get(packageId, eventType);

    if (!row) {
      return null;
    }

    return this.mapEventCheckpoint(row as Record<string, unknown>);
  }

  upsertEventCheckpoint(input: {
    packageId: string;
    eventType: string;
    txDigest: string;
    eventSeq: string;
  }): void {
    this.db
      .prepare(`
        INSERT INTO event_checkpoints (
          package_id, event_type, tx_digest, event_seq, updated_at
        ) VALUES (
          @packageId, @eventType, @txDigest, @eventSeq, @updatedAt
        )
        ON CONFLICT(package_id, event_type) DO UPDATE SET
          tx_digest = excluded.tx_digest,
          event_seq = excluded.event_seq,
          updated_at = excluded.updated_at
      `)
      .run({
        ...input,
        updatedAt: nowMs(),
      });
  }

  tryMarkProcessedEvent(
    txDigest: string,
    eventSeq: string,
    eventType: string,
    createdAt: number,
  ): boolean {
    try {
      this.db
        .prepare(`
          INSERT INTO processed_chain_events (tx_digest, event_seq, event_type, created_at)
          VALUES (?, ?, ?, ?)
        `)
        .run(txDigest, eventSeq, eventType, createdAt);
      return true;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return false;
      }
      throw error;
    }
  }

  resetSyncState(options: { rebuild?: boolean } = {}): void {
    this.withTransaction(() => {
      this.db.exec('DELETE FROM event_checkpoints;');

      if (options.rebuild) {
        this.db.exec('DELETE FROM processed_chain_events;');
        this.db.exec('DELETE FROM indexed_events;');
        this.db.exec('DELETE FROM claims;');
        this.db.exec('DELETE FROM hunters;');
        this.db.exec('DELETE FROM bounties;');
        this.db.exec(`DELETE FROM sqlite_sequence WHERE name IN ('claims', 'indexed_events');`);
      }
    });
  }

  upsertBounty(input: {
    id: string;
    creator: string;
    target: string;
    rewardAmount: number;
    status: number;
    description?: string | null;
    createdAt: number;
    expiresAt: number;
    txDigest: string;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO bounties (
        id, creator, target, reward_amount, status, description,
        created_at, expires_at, tx_digest, updated_at
      ) VALUES (
        @id, @creator, @target, @rewardAmount, @status, @description,
        @createdAt, @expiresAt, @txDigest, @updatedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        creator = excluded.creator,
        target = excluded.target,
        reward_amount = excluded.reward_amount,
        status = excluded.status,
        description = excluded.description,
        created_at = excluded.created_at,
        expires_at = excluded.expires_at,
        tx_digest = excluded.tx_digest,
        updated_at = excluded.updated_at
    `);

    stmt.run({
      ...input,
      description: input.description ?? null,
      updatedAt: nowMs(),
    });
  }

  markBountyStatus(
    id: string,
    status: number,
    claimedBy: string | null = null,
    claimedAt: number | null = null,
  ): void {
    const stmt = this.db.prepare(`
      UPDATE bounties
      SET status = @status,
          claimed_by = @claimedBy,
          claimed_at = @claimedAt,
          updated_at = @updatedAt
      WHERE id = @id
    `);

    stmt.run({
      id,
      status,
      claimedBy,
      claimedAt,
      updatedAt: nowMs(),
    });
  }

  upsertHunter(input: {
    address: string;
    badgeId?: string | null;
    killsDelta?: number;
    earningsDelta?: number;
    streak?: number;
    maxStreak?: number;
    lastKillAt?: number | null;
  }): void {
    const now = nowMs();
    const hasHunter = this.db
      .prepare('SELECT 1 FROM hunters WHERE address = ? LIMIT 1')
      .get(input.address);

    if (!hasHunter) {
      this.db
        .prepare(`
          INSERT INTO hunters (
            address, badge_id, kills, total_earnings, streak, max_streak, last_kill_at, updated_at
          ) VALUES (
            @address, @badgeId, @kills, @earnings, @streak, @maxStreak, @lastKillAt, @updatedAt
          )
        `)
        .run({
          address: input.address,
          badgeId: input.badgeId ?? null,
          kills: input.killsDelta ?? 0,
          earnings: input.earningsDelta ?? 0,
          streak: input.streak ?? 0,
          maxStreak: input.maxStreak ?? 0,
          lastKillAt: input.lastKillAt ?? null,
          updatedAt: now,
        });
      return;
    }

    const current = this.db
      .prepare('SELECT kills, total_earnings, streak, max_streak FROM hunters WHERE address = ?')
      .get(input.address) as { kills: number; total_earnings: number; streak: number; max_streak: number };

    const nextKills = current.kills + (input.killsDelta ?? 0);
    const nextEarnings = current.total_earnings + (input.earningsDelta ?? 0);
    const nextStreak = input.streak ?? current.streak;
    const nextMaxStreak = Math.max(current.max_streak, input.maxStreak ?? nextStreak);

    this.db
      .prepare(`
        UPDATE hunters
        SET badge_id = COALESCE(@badgeId, badge_id),
            kills = @kills,
            total_earnings = @earnings,
            streak = @streak,
            max_streak = @maxStreak,
            last_kill_at = COALESCE(@lastKillAt, last_kill_at),
            updated_at = @updatedAt
        WHERE address = @address
      `)
      .run({
        address: input.address,
        badgeId: input.badgeId ?? null,
        kills: nextKills,
        earnings: nextEarnings,
        streak: nextStreak,
        maxStreak: nextMaxStreak,
        lastKillAt: input.lastKillAt ?? null,
        updatedAt: now,
      });
  }

  insertClaim(input: {
    bountyId: string;
    hunter: string;
    target: string;
    rewardAmount: number;
    killDigest: string;
    solarSystemId: number | null;
    claimedAt: number;
    txDigest: string;
  }): void {
    this.db
      .prepare(`
        INSERT INTO claims (
          bounty_id, hunter, target, reward_amount, kill_digest,
          solar_system_id, claimed_at, tx_digest
        ) VALUES (
          @bountyId, @hunter, @target, @rewardAmount, @killDigest,
          @solarSystemId, @claimedAt, @txDigest
        )
      `)
      .run(input);
  }

  appendEvent(event: EventEnvelope): void {
    this.db
      .prepare(`
        INSERT INTO indexed_events (event_type, tx_digest, payload, created_at)
        VALUES (@eventType, @txDigest, @payload, @createdAt)
      `)
      .run({
        eventType: event.type,
        txDigest: event.txDigest,
        payload: JSON.stringify(event.payload),
        createdAt: event.timestampMs,
      });
  }

  listBounties(filter: BountyListFilter = {}): Bounty[] {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));
    const sortBy = filter.sortBy ?? 'created_at';
    const sortOrder = (filter.sortOrder ?? 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const clauses: string[] = [];
    const params: Record<string, string | number> = {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    };

    if (typeof filter.status === 'number') {
      clauses.push('status = @status');
      params.status = filter.status;
    }
    if (filter.target) {
      clauses.push('target = @target');
      params.target = filter.target;
    }
    if (filter.creator) {
      clauses.push('creator = @creator');
      params.creator = filter.creator;
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = this.db
      .prepare(`
        SELECT *
        FROM bounties
        ${where}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT @limit OFFSET @offset
      `)
      .all(params);

    return rows.map((row) => this.mapBounty(row));
  }

  getBounty(id: string): Bounty | null {
    const row = this.db.prepare('SELECT * FROM bounties WHERE id = ?').get(id);
    return row ? this.mapBounty(row) : null;
  }

  getBountiesByTarget(address: string): Bounty[] {
    return this.listBounties({ target: address, pageSize: 100, sortBy: 'reward_amount' });
  }

  getBountiesByCreator(address: string): Bounty[] {
    return this.listBounties({ creator: address, pageSize: 100, sortBy: 'created_at' });
  }

  getLeaderboard(limit = 100): Hunter[] {
    const rows = this.db
      .prepare(`
        SELECT
          address,
          badge_id,
          kills,
          total_earnings,
          streak,
          max_streak,
          last_kill_at,
          ROW_NUMBER() OVER (ORDER BY total_earnings DESC, kills DESC, address ASC) AS rank
        FROM hunters
        ORDER BY total_earnings DESC, kills DESC, address ASC
        LIMIT ?
      `)
      .all(limit);

    return rows.map((row) => this.mapHunter(row));
  }

  getHunter(address: string): Hunter | null {
    const row = this.db
      .prepare(`
        SELECT
          address,
          badge_id,
          kills,
          total_earnings,
          streak,
          max_streak,
          last_kill_at,
          0 AS rank
        FROM hunters
        WHERE address = ?
        LIMIT 1
      `)
      .get(address);

    if (!row) return null;

    const rankRow = this.db
      .prepare(`
        SELECT rank FROM (
          SELECT address,
                 ROW_NUMBER() OVER (ORDER BY total_earnings DESC, kills DESC, address ASC) AS rank
          FROM hunters
        ) ranked
        WHERE address = ?
      `)
      .get(address) as { rank: number } | undefined;

    return this.mapHunter({ ...row, rank: rankRow?.rank ?? 0 });
  }

  getRecentClaims(limit = 20): Claim[] {
    const rows = this.db
      .prepare('SELECT * FROM claims ORDER BY claimed_at DESC LIMIT ?')
      .all(Math.min(100, Math.max(1, limit)));

    return rows.map((row) => this.mapClaim(row));
  }

  getRecentEvents(limit = 30): IndexedEvent[] {
    const rows = this.db
      .prepare('SELECT * FROM indexed_events ORDER BY created_at DESC LIMIT ?')
      .all(Math.min(100, Math.max(1, limit)));

    return rows.map((row) => ({
      id: Number(row.id),
      eventType: String(row.event_type),
      txDigest: String(row.tx_digest),
      payload: JSON.parse(String(row.payload)) as Record<string, unknown>,
      createdAt: Number(row.created_at),
    }));
  }

  getStats(): StatsSnapshot {
    const summary = this.db
      .prepare(`
        SELECT
          SUM(CASE WHEN status = @active THEN 1 ELSE 0 END) AS active_bounties,
          COUNT(*) AS total_bounties,
          SUM(CASE WHEN status = @claimed THEN reward_amount ELSE 0 END) AS total_rewards_paid,
          COUNT(DISTINCT CASE WHEN status = @active THEN target ELSE NULL END) AS wanted_targets
        FROM bounties
      `)
      .get({ active: BOUNTY_STATUS.ACTIVE, claimed: BOUNTY_STATUS.CLAIMED }) as {
      active_bounties: number | null;
      total_bounties: number;
      total_rewards_paid: number | null;
      wanted_targets: number | null;
    };

    const totalClaims = this.db
      .prepare('SELECT COUNT(*) AS count FROM claims')
      .get() as { count: number };

    const topHunter = this.db
      .prepare('SELECT address, total_earnings FROM hunters ORDER BY total_earnings DESC, kills DESC LIMIT 1')
      .get() as { address: string; total_earnings: number } | undefined;

    return {
      activeBounties: Number(summary.active_bounties ?? 0),
      totalBounties: Number(summary.total_bounties ?? 0),
      totalRewardsPaid: Number(summary.total_rewards_paid ?? 0),
      totalClaims: Number(totalClaims.count ?? 0),
      wantedTargets: Number(summary.wanted_targets ?? 0),
      topHunter: topHunter?.address ?? null,
      topReward: Number(topHunter?.total_earnings ?? 0),
    };
  }

  private mapBounty(row: Record<string, unknown>): Bounty {
    return {
      id: String(row.id),
      creator: String(row.creator),
      target: String(row.target),
      rewardAmount: Number(row.reward_amount),
      status: Number(row.status) as BountyStatus,
      description: row.description === null ? null : String(row.description),
      createdAt: Number(row.created_at),
      expiresAt: Number(row.expires_at),
      claimedBy: row.claimed_by === null ? null : String(row.claimed_by),
      claimedAt: row.claimed_at === null ? null : Number(row.claimed_at),
      txDigest: String(row.tx_digest),
      updatedAt: Number(row.updated_at),
    };
  }

  private mapHunter(row: Record<string, unknown>): Hunter {
    return {
      address: String(row.address),
      badgeId: row.badge_id === null ? null : String(row.badge_id),
      kills: Number(row.kills),
      totalEarnings: Number(row.total_earnings),
      streak: Number(row.streak),
      maxStreak: Number(row.max_streak),
      rank: Number(row.rank),
      lastKillAt: row.last_kill_at === null ? null : Number(row.last_kill_at),
    };
  }

  private mapClaim(row: Record<string, unknown>): Claim {
    return {
      id: Number(row.id),
      bountyId: String(row.bounty_id),
      hunter: String(row.hunter),
      target: String(row.target),
      rewardAmount: Number(row.reward_amount),
      killDigest: String(row.kill_digest),
      solarSystemId: row.solar_system_id === null ? null : Number(row.solar_system_id),
      claimedAt: Number(row.claimed_at),
      txDigest: String(row.tx_digest),
    };
  }

  private mapEventCheckpoint(row: Record<string, unknown>): EventCheckpoint {
    return {
      packageId: String(row.package_id),
      eventType: String(row.event_type),
      txDigest: String(row.tx_digest),
      eventSeq: String(row.event_seq),
      updatedAt: Number(row.updated_at),
    };
  }
}
