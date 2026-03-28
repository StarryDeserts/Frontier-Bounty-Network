export type BountyStatus = 0 | 1 | 2 | 3;

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

export interface BountyFilter {
  status?: BountyStatus;
  target?: string;
  creator?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'reward_amount' | 'expires_at';
  sortOrder?: 'asc' | 'desc';
}
