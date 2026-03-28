export const BOUNTY_STATUS = {
  ACTIVE: 0,
  CLAIMED: 1,
  CANCELLED: 2,
  EXPIRED: 3,
} as const;

export type BountyStatus = (typeof BOUNTY_STATUS)[keyof typeof BOUNTY_STATUS];

export interface Bounty {
  id: string;
  creator: string;
  target: string;
  rewardAmount: number;
  status: BountyStatus;
  description: string | null;
  createdAt: number;
  expiresAt: number;
  claimedBy: string | null;
  claimedAt: number | null;
  txDigest: string;
  updatedAt: number;
}

export interface Hunter {
  address: string;
  badgeId: string | null;
  kills: number;
  totalEarnings: number;
  streak: number;
  maxStreak: number;
  rank: number;
  lastKillAt: number | null;
}

export interface Claim {
  id: number;
  bountyId: string;
  hunter: string;
  target: string;
  rewardAmount: number;
  killDigest: string;
  solarSystemId: number | null;
  claimedAt: number;
  txDigest: string;
}

export interface IndexedEvent {
  id: number;
  eventType: string;
  txDigest: string;
  payload: Record<string, unknown>;
  createdAt: number;
}

export interface StatsSnapshot {
  activeBounties: number;
  totalBounties: number;
  totalRewardsPaid: number;
  totalClaims: number;
  wantedTargets: number;
  topHunter: string | null;
  topReward: number;
}

export interface EventEnvelope {
  type: string;
  txDigest: string;
  payload: Record<string, unknown>;
  timestampMs: number;
}

export interface EventCheckpoint {
  packageId: string;
  eventType: string;
  txDigest: string;
  eventSeq: string;
  updatedAt: number;
}

export interface EventCursor {
  txDigest: string;
  eventSeq: string;
}
