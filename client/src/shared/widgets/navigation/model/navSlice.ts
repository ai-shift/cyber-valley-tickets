import { create } from "zustand";

interface NavState {
  isFormNavVisible: boolean;
  setFormNavVisible: (visible: boolean) => void;
}

export const useNavStore = create<NavState>((set) => ({
  isFormNavVisible: false,
  setFormNavVisible: (visible) => set({ isFormNavVisible: visible }),
}));
