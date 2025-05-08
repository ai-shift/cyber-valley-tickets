import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RefreshState {
  hasJWT: boolean;
  setHasJWT: (hasJWT: boolean) => void;
}

export const useRefreshSlice = create<RefreshState>()(
  persist(
    (set) => ({
      hasJWT: false,
      setHasJWT: (hasJWT: boolean) =>
        set({
          hasJWT,
        }),
    }),
    { name: "jwt" },
  ),
);
