import { create } from 'zustand';
export const useAppStore = create((set) => ({
    lastError: null,
    setLastError: (message) => set({ lastError: message }),
}));
