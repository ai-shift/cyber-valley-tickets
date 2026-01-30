import { create } from "zustand";

interface NavState {
  isFormNavVisible: boolean;
  toggleFormNav: (visible: boolean) => void;
}

export const useNavStore = create<NavState>((set) => ({
  isFormNavVisible: true,
  toggleFormNav: (visible) => set({ isFormNavVisible: visible }),
}));
