import type { IndexerRepository } from '../db/repository.js';
import { BOUNTY_STATUS } from '../types.js';
import { asNumber, asString, normalizeAddress } from '../utils.js';

export const handleBountyVerified = (
  repo: IndexerRepository,
  payload: Record<string, unknown>,
  txDigest: string,
  timestampMs: number,
): void => {
  const bountyId = asString(payload.bounty_id);
  const hunter = normalizeAddress(payload.hunter);
  const target = normalizeAddress(payload.target);
  const rewardAmount = asNumber(payload.reward_amount);
  const claimedAt = asNumber(payload.claimed_at, timestampMs);
  const killDigest = asString(payload.kill_digest);
  const solarSystemIdRaw = payload.solar_system_id;

  repo.markBountyStatus(bountyId, BOUNTY_STATUS.CLAIMED, hunter, claimedAt);

  repo.upsertHunter({
    address: hunter,
    killsDelta: 1,
    earningsDelta: rewardAmount,
    streak: undefined,
    maxStreak: undefined,
    lastKillAt: claimedAt,
  });

  try {
    repo.insertClaim({
      bountyId,
      hunter,
      target,
      rewardAmount,
      killDigest,
      solarSystemId: solarSystemIdRaw === undefined ? null : asNumber(solarSystemIdRaw),
      claimedAt,
      txDigest,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('UNIQUE')) {
      throw error;
    }
  }
};
