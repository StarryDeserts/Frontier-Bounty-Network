import type { ClaimContext, ProviderResolution } from '../types.js';
import type { ClaimProofProvider } from '../provider.js';

export class EveFrontierKillRecordProvider implements ClaimProofProvider {
  readonly name = 'frontier' as const;

  constructor(private readonly apiBaseUrl: string | null) {}

  async resolve(_input: ClaimContext): Promise<ProviderResolution> {
    if (!this.apiBaseUrl) {
      return {
        status: 'provider_unconfigured',
        provider: this.name,
        notes: [
          'CLAIM_PROOF_PROVIDER=frontier but FRONTIER_KILL_API_BASE_URL is not configured.',
          'TODO: connect this provider to the EVE Frontier kill-record source and map records into the canonical KillProof draft shape.',
        ],
      };
    }

    return {
      status: 'not_found',
      provider: this.name,
      notes: [
        `EVE Frontier kill-record provider stub is configured for ${this.apiBaseUrl} but no live integration is implemented in this build.`,
        'TODO: fetch kill records, normalize participant addresses, derive a canonical digest, and return the most recent matching kill.',
      ],
    };
  }
}

export const FrontierClaimProofProvider = EveFrontierKillRecordProvider;
