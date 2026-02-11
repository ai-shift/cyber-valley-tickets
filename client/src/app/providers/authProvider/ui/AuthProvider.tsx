import type { User } from "@/entities/user";
import { client, wallets } from "@/shared/lib/web3";
import { useState } from "react";
import type React from "react";
import { useEffect } from "react";
import { Outlet } from "react-router";
import {
  useActiveAccount,
  useActiveWallet,
  useActiveWalletConnectionStatus,
  useAutoConnect,
} from "thirdweb/react";
import { useAuthSlice } from "../model/authSlice";

export const AuthProvider: React.FC = () => {
  const { setAddress, setStatus, setUser, clear, ticketPoll, clearTicketPoll } =
    useAuthSlice();
  const [walletChanged, setWalletChanged] = useState(false);

  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const walletConnectionStatus = useActiveWalletConnectionStatus();
  useEffect(() => {
    if (wallet == null) {
      return;
    }
    wallet.subscribe("accountChanged", () => {
      console.log("account changed");
      setWalletChanged(true);
    });
  }, [wallet]);

  useAutoConnect({
    client,
    wallets,
    onConnect: (connecting) => console.log("onConnect", connecting),
    timeout: 5000,
  });

  useEffect(() => {
    const address = account?.address?.toLowerCase() ?? null;
    if (!address) {
      // Avoid treating transient disconnects/reconnects (common during WalletConnect flows)
      // as an app logout.
      if (
        walletConnectionStatus === "connecting" ||
        walletConnectionStatus === "unknown"
      ) {
        return;
      }
      if (walletConnectionStatus === "disconnected") clear();
      return;
    }

    const syncUser = async () => {
      setAddress(address);
      setStatus("connected");
      setWalletChanged(false);

      const url = new URL(
        "/api/users/current/",
        import.meta.env.PUBLIC_API_HOST,
      );
      url.searchParams.set("address", address);
      const resp = await fetch(url.toString(), { credentials: "include" });
      if (!resp.ok) {
        setUser(null);
        return;
      }
      setUser((await resp.json()) as User);
    };

    void syncUser();
  }, [
    account?.address,
    clear,
    setAddress,
    setStatus,
    setUser,
    walletChanged,
    walletConnectionStatus,
  ]);

  useEffect(() => {
    const address = account?.address?.toLowerCase() ?? null;
    if (!address) return;
    if (!ticketPoll) return;
    if (walletConnectionStatus !== "connected") return;

    const startedAt = ticketPoll.startedAtMs;
    const maxMs = 90_000;
    const intervalMs = 2_000;

    let stopped = false;
    const ac = new AbortController();

    const tick = async () => {
      if (stopped) return;
      if (Date.now() - startedAt > maxMs) {
        clearTicketPoll();
        return;
      }

      try {
        const url = new URL(
          "/api/users/current/",
          import.meta.env.PUBLIC_API_HOST,
        );
        url.searchParams.set("address", address);

        const resp = await fetch(url.toString(), {
          credentials: "include",
          signal: ac.signal,
        });
        if (!resp.ok) return;

        const nextUser = (await resp.json()) as User;
        setUser(nextUser);

        const eventTickets = (nextUser.tickets ?? []).filter(
          (t) => t.eventId === ticketPoll.eventId,
        );
        const ok =
          ticketPoll.targetCount == null
            ? eventTickets.length > 0
            : eventTickets.length >= ticketPoll.targetCount;
        if (ok) clearTicketPoll();
      } catch (e) {
        // Ignore transient network errors; the loop will retry.
        if (import.meta.env.DEV) console.log("ticket poll failed", e);
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), intervalMs);

    return () => {
      stopped = true;
      ac.abort();
      window.clearInterval(id);
    };
  }, [
    account?.address,
    clearTicketPoll,
    setUser,
    ticketPoll,
    walletConnectionStatus,
  ]);

  return <Outlet />;
};
