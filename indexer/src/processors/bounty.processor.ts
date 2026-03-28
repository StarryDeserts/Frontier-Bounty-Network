import type { IndexerRepository } from '../db/repository.js';
import { BOUNTY_STATUS } from '../types.js';
import { asNumber, asString, normalizeAddress } from '../utils.js';

export const handleBountyCreated = (
  repo: IndexerRepository,
  payload: Record<string, unknown>,
  txDigest: string,
  timestampMs: number,
): void => {
  repo.upsertBounty({
    id: asString(payload.bounty_id),
    creator: normalizeAddress(payload.creator),
    target: normalizeAddress(payload.target),
    rewardAmount: asNumber(payload.reward_amount),
    status: BOUNTY_STATUS.ACTIVE,
    description: typeof payload.description === 'string' ? payload.description : null,
    createdAt: asNumber(payload.created_at, timestampMs),
    expiresAt: asNumber(payload.expires_at),
    txDigest,
  });
};

export const handleBountyCancelled = (
  repo: IndexerRepository,
  payload: Record<string, unknown>,
): void => {
  repo.markBountyStatus(asString(payload.bounty_id), BOUNTY_STATUS.CANCELLED);
};

export const handleBountyExpired = (
  repo: IndexerRepository,
  payload: Record<string, unknown>,
): void => {
  repo.markBountyStatus(asString(payload.bounty_id), BOUNTY_STATUS.EXPIRED);
};

export const handleBountyClaimed = (
  repo: IndexerRepository,
  payload: Record<string, unknown>,
): void => {
  repo.markBountyStatus(
    asString(payload.bounty_id),
    BOUNTY_STATUS.CLAIMED,
    normalizeAddress(payload.hunter),
    asNumber(payload.claimed_at),
  );
};
