export interface IndexedEvent {
  id: number | string;
  eventType: string;
  txDigest: string;
  payload: Record<string, unknown>;
  createdAt: number;
}

export interface StatsSnapshot {
  activeBounties: number;
  totalBounties: number;
  totalRewardsPaid: number | string;
  totalClaims: number;
  wantedTargets: number;
  topHunter: string | null;
  topReward: number;
}
