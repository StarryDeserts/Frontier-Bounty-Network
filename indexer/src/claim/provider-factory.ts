import { config } from '../config.js';
import type { ClaimProofProvider } from './provider.js';
import { EveFrontierKillRecordProvider } from './providers/frontier.js';
import { MockClaimProofProvider } from './providers/mock.js';

export const createClaimProofProvider = (): ClaimProofProvider | null => {
  if (config.claimProofProvider === 'mock') {
    return new MockClaimProofProvider();
  }

  if (config.claimProofProvider === 'frontier') {
    return new EveFrontierKillRecordProvider(config.frontierKillApiBaseUrl);
  }

  return null;
};
