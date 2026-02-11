import type { User } from "@/entities/user";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthStatus = "boot" | "connected" | "disconnected";

type TicketPollState = {
  eventId: number;
  // Stop polling when user has at least this many tickets for `eventId`.
  // If null/undefined, "any ticket for eventId" is enough.
  targetCount?: number;
  startedAtMs: number;
};

interface AuthState {
  status: AuthStatus;
  address: string | null;
  user: User | null;
  ticketPoll: TicketPollState | null;

  setStatus: (status: AuthStatus) => void;
  setAddress: (address: string | null) => void;
  setUser: (user: User | null) => void;
  startTicketPoll: (args: { eventId: number; targetCount?: number }) => void;
  clearTicketPoll: () => void;
  clear: () => void;
}

export const useAuthSlice = create<AuthState>()(
  persist(
    (set) => ({
      status: "boot",
      address: null,
      user: null,
      ticketPoll: null,

      setStatus: (status) => set({ status }),
      setAddress: (address) => set({ address }),
      setUser: (user) => set({ user }),
      startTicketPoll: ({ eventId, targetCount }) =>
        set({
          ticketPoll: { eventId, targetCount, startedAtMs: Date.now() },
        }),
      clearTicketPoll: () => set({ ticketPoll: null }),
      clear: () =>
        set({
          status: "disconnected",
          address: null,
          user: null,
          ticketPoll: null,
        }),
    }),
    {
      name: "session",
      // Don't persist ephemeral polling state across reloads.
      partialize: ({ status, address, user }) => ({ status, address, user }),
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
          ticketPoll: null,
          startTicketPoll: () => {},
          clearTicketPoll: () => {},
          setStatus: () => {},
          setAddress: () => {},
          setUser: () => {},
          clear: () => {},
        } as unknown as AuthState;
      },
    },
  ),
);
