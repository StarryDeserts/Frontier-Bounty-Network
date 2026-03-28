import { create } from 'zustand';

import type { BountyStatus } from '@/types/bounty';

interface FilterStoreState {
  status?: BountyStatus;
  sortBy: 'created_at' | 'reward_amount' | 'expires_at';
  sortOrder: 'asc' | 'desc';
  setStatus: (status?: BountyStatus) => void;
  setSortBy: (value: 'created_at' | 'reward_amount' | 'expires_at') => void;
  setSortOrder: (value: 'asc' | 'desc') => void;
}

export const useFilterStore = create<FilterStoreState>((set) => ({
  status: undefined,
  sortBy: 'created_at',
  sortOrder: 'desc',
  setStatus: (status) => set({ status }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
}));
