import type { Bounty } from '../types.js';

export type ClaimProofProviderName = 'disabled' | 'mock' | 'frontier';
export type ClaimProofIssuerMode = 'manual';
export type ClaimProofResolutionStatus = 'disabled' | 'provider_unconfigured' | 'not_found' | 'ready';

export interface ResolveClaimProofInput {
  bountyId: string;
  hunter: string;
}

export interface ClaimProofBountySummary {
  id: string;
  target: string;
  createdAt: number;
  expiresAt: number;
}

export interface ProofDraft {
  killer: string;
  victim: string;
  timestampMs: number;
  solarSystemId: number;
  killDigestHex: string;
}

export interface ResolvedKillRecord extends ProofDraft {
  provider: Exclude<ClaimProofProviderName, 'disabled'>;
}

export interface ProviderResolution {
  status: Exclude<ClaimProofResolutionStatus, 'disabled'>;
  provider: ClaimProofProviderName;
  proof?: ResolvedKillRecord;
  notes: string[];
}

export interface MoveCallPlan {
  packageId: string;
  module: 'bounty_verify';
  function: 'issue_kill_proof';
  target: string;
  args: string[];
  gasBudget: number;
}

export interface ProofIssuancePlan {
  mode: ClaimProofIssuerMode;
  moveCall: MoveCallPlan;
  powershellCommand: string;
}

export interface ClaimProofResolution {
  status: ClaimProofResolutionStatus;
  provider: ClaimProofProviderName;
  bounty: ClaimProofBountySummary | null;
  proofDraft?: ProofDraft;
  issuance?: ProofIssuancePlan;
  notes: string[];
}

export interface ClaimContext {
  bounty: Bounty;
  hunter: string;
}
