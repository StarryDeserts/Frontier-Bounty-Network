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
