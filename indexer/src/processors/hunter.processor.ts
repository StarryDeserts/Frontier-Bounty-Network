import type { IndexerRepository } from '../db/repository.js';
import { asString, normalizeAddress } from '../utils.js';

export const handleHunterRegistered = (
  repo: IndexerRepository,
  payload: Record<string, unknown>,
): void => {
  repo.upsertHunter({
    address: normalizeAddress(payload.hunter),
    badgeId: asString(payload.badge_id),
    killsDelta: 0,
    earningsDelta: 0,
  });
};
