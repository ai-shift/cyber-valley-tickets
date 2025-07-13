import type { User } from "@/entities/user";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  hasJWT: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthSlice = create<AuthState>()(
  persist(
    (set) => ({
      hasJWT: false,
      user: null,
      login: (user: User) => {
        console.log("setting user", user);
        set({
          hasJWT: true,
          user,
        });
      },
      logout: () =>
        set({
          hasJWT: false,
          user: null,
        }),
    }),
    { name: "session" },
  ),
);
