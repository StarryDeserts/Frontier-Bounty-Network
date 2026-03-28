import type { ClaimContext, ProviderResolution } from './types.js';

// This provider boundary is the off-chain mapping layer between an external
// EVE Frontier kill-record source and the on-chain KillProof issuance flow.
export interface ClaimProofProvider {
  readonly name: 'mock' | 'frontier';
  resolve(input: ClaimContext): Promise<ProviderResolution>;
}
