import type { IndexerRepository } from '../db/repository.js';
import { normalizeAddress } from '../utils.js';
import type { ClaimProofProvider } from './provider.js';
import type { ClaimProofResolution, ClaimProofBountySummary, ResolveClaimProofInput } from './types.js';
import type { ProofIssuer } from './issuer.js';

const bountySummary = (bounty: { id: string; target: string; createdAt: number; expiresAt: number }): ClaimProofBountySummary => ({
  id: bounty.id,
  target: bounty.target,
  createdAt: bounty.createdAt,
  expiresAt: bounty.expiresAt,
});

export class ClaimProofService {
  constructor(
    private readonly repo: IndexerRepository,
    private readonly provider: ClaimProofProvider | null,
    private readonly issuer: ProofIssuer,
  ) {}

  async resolve(input: ResolveClaimProofInput): Promise<ClaimProofResolution> {
    const hunter = normalizeAddress(input.hunter);
    const bounty = this.repo.getBounty(input.bountyId);

    if (!bounty) {
      return {
        status: 'not_found',
        provider: this.provider?.name ?? 'disabled',
        bounty: null,
        notes: ['Bounty was not found in the indexer projection.'],
      };
    }

    const summary = bountySummary(bounty);
    if (!this.provider) {
      return {
        status: 'disabled',
        provider: 'disabled',
        bounty: summary,
        notes: [
          'Claim proof resolution is disabled.',
          'Set CLAIM_PROOF_PROVIDER=mock for local testing or CLAIM_PROOF_PROVIDER=frontier once a real provider is available.',
        ],
      };
    }

    const result = await this.provider.resolve({ bounty, hunter });
    if (result.status !== 'ready' || !result.proof) {
      return {
        status: result.status,
        provider: result.provider,
        bounty: summary,
        notes: result.notes,
      };
    }

    return {
      status: 'ready',
      provider: result.provider,
      bounty: summary,
      proofDraft: {
        killer: result.proof.killer,
        victim: result.proof.victim,
        timestampMs: result.proof.timestampMs,
        solarSystemId: result.proof.solarSystemId,
        killDigestHex: result.proof.killDigestHex,
      },
      issuance: this.issuer.issue({ hunter, proof: result.proof }),
      notes: result.notes,
    };
  }
}
