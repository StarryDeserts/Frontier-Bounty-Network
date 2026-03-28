import type { ClaimContext, ProviderResolution, ResolvedKillRecord } from '../types.js';
import type { ClaimProofProvider } from '../provider.js';

const toHex = (value: string): string => Buffer.from(value, 'utf8').toString('hex');

export class MockClaimProofProvider implements ClaimProofProvider {
  readonly name = 'mock' as const;

  async resolve(input: ClaimContext): Promise<ProviderResolution> {
    const proof: ResolvedKillRecord = {
      provider: this.name,
      killer: input.hunter,
      victim: input.bounty.target,
      timestampMs: input.bounty.createdAt + 60_000,
      solarSystemId: 42,
      killDigestHex: toHex(`mock:${input.bounty.id}:${input.hunter}:${input.bounty.target}`),
    };

    return {
      status: 'ready',
      provider: this.name,
      proof,
      notes: [
        'Mock provider returns deterministic kill records for local validation only.',
        'Do not use mock digests as evidence for a production verifier.',
      ],
    };
  }
}
