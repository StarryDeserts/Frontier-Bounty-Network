export interface ClaimRecord {
  id: string;
  bountyId: string;
  hunter: string;
  target: string;
  rewardAmount: number;
  claimedAt: number;
  txDigest: string;
  killDigest?: string | null;
  solarSystemId?: number | null;
}
