import type { User } from "@/entities/user";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  hasJWT: boolean;
  user: User | null;
  signature: string | null;
  signatureExpiresAt: number | null;
  signatureRefreshAt: number | null;
  login: (user: User) => void;
  setSignature: (signature: string, expiresAt: number) => void;
  logout: () => void;
}

export const useAuthSlice = create<AuthState>()(
  persist(
    (set) => ({
      hasJWT: false,
      user: null,
      signature: null,
      signatureExpiresAt: null,
      signatureRefreshAt: null,
      login: (user: User) => {
        console.log("setting user", user);
        set({
          hasJWT: true,
          user,
        });
      },
      setSignature: (signature: string, expiresAt: number) => {
        const refreshAt = Math.max(expiresAt - 60 * 60 * 24 * 3, 0);
        set({
          signature,
          signatureExpiresAt: expiresAt,
          signatureRefreshAt: refreshAt,
        });
      },
      logout: () =>
        set({
          hasJWT: false,
          user: null,
          signature: null,
          signatureExpiresAt: null,
          signatureRefreshAt: null,
        }),
    }),
    { name: "session" },
  ),
);
