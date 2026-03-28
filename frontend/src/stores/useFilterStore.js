import { create } from 'zustand';
export const useFilterStore = create((set) => ({
    status: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
    setStatus: (status) => set({ status }),
    setSortBy: (sortBy) => set({ sortBy }),
    setSortOrder: (sortOrder) => set({ sortOrder }),
}));
