import type { User } from "@/entities/user";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthStatus = "boot" | "connected" | "disconnected";

interface AuthState {
  status: AuthStatus;
  address: string | null;
  user: User | null;

  setStatus: (status: AuthStatus) => void;
  setAddress: (address: string | null) => void;
  setUser: (user: User | null) => void;
  clear: () => void;
}

export const useAuthSlice = create<AuthState>()(
  persist(
    (set) => ({
      status: "boot",
      address: null,
      user: null,

      setStatus: (status) => set({ status }),
      setAddress: (address) => set({ address }),
      setUser: (user) => set({ user }),
      clear: () =>
        set({
          status: "disconnected",
          address: null,
          user: null,
        }),
    }),
    {
      name: "session",
      // Drop legacy fields from the persisted store to avoid drift.
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return persistedState as unknown as AuthState;
        }
        const s = persistedState as Record<string, unknown>;
        const address = (s.address as string | null) ?? null;
        const user = (s.user as User | null) ?? null;
        const status = (s.status as AuthStatus) ?? "boot";
        return {
          status,
          address,
          user,
        } as unknown as AuthState;
      },
    },
  ),
);
