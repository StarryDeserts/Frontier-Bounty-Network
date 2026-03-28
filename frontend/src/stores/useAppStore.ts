import { create } from 'zustand';

interface AppStoreState {
  lastError: string | null;
  setLastError: (message: string | null) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  lastError: null,
  setLastError: (message) => set({ lastError: message }),
}));
