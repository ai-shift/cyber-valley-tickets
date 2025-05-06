import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface RefreshState {
  hasJWT: boolean;
  setHasJWT: (hasJWT: boolean) => void;
}

export const useRefreshSlice = create<RefreshState>()(
  devtools((set) => ({
    hasJWT: true,
    setHasJWT: (hasJWT: boolean) =>
      set({
        hasJWT,
      }),
  })),
);
