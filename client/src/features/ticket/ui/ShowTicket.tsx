import { useOrderStore } from "@/entities/order";
import { apiClient } from "@/shared/api";
import { pluralTickets } from "@/shared/lib/pluralDays";
import { Loader } from "@/shared/ui/Loader";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { useQueries } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";
import type { Ticket } from "../model/types";
import { TicketCard } from "./TicketCard";
import { fetchSiwePayload, fetchSiweVerify } from "@/shared/lib/siwe/api";
import { getStoredProof, setStoredProof } from "@/shared/lib/siwe/proofStorage";

type ShowTicketProps = {
  tickets: Ticket[];
  hasPassed: boolean;
  event: {
    id: number;
    title: string;
    ticketPrice: number;
  };
};

export const ShowTicket: React.FC<ShowTicketProps> = ({
  tickets,
  hasPassed,
  event,
}) => {
  const navigate = useNavigate();
  const { setTicketOrder } = useOrderStore();
  const [open, setOpen] = useState(false);
  const wasClosed = useRef<boolean>(false);
  const account = useActiveAccount();
  const [proofToken, setProofToken] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const shouldPollRedeemStatus = open && !!proofToken;

  const ticketQueries = useQueries({
    queries: tickets.map((ticket) => ({
      queryFn: () =>
        apiClient.GET("/api/events/{event_id}/tickets/{ticket_id}", {
          params: {
            path: {
              event_id: ticket.eventId,
              ticket_id: Number(ticket.id),
            },
          } as any,
        }),
      select: (data: {
        data?: { isRedeemed: boolean; pendingIsRedeemed: boolean };
      }) => data.data,
      queryKey: ["redeemed", ticket.eventId, ticket.id],
      enabled: shouldPollRedeemStatus,
      refetchInterval: shouldPollRedeemStatus ? 1000 : -1,
    })),
  });

  const hasError = ticketQueries.some((query) => query.error);
  const allData = ticketQueries.map((query) => query.data);
  const canCheckRedeemStatus = !hasError && !allData.some((data) => !data);

  useEffect(() => {
    if (!canCheckRedeemStatus) return;
    const anyPendingRedeemed = allData.some(
      (data) => data?.pendingIsRedeemed && !data?.isRedeemed,
    );
    if (anyPendingRedeemed && !wasClosed.current) {
      setOpen(false);
      wasClosed.current = true;
    }
  }, [allData, canCheckRedeemStatus]);

  useEffect(() => {
    if (!open) return;
    const addr = account?.address;
    if (!addr) return;
    const stored = getStoredProof(addr, "ticket_qr");
    setProofToken(stored?.token ?? null);
  }, [open, account?.address]);

  const signToShowQr = async () => {
    if (!account) {
      alert("No active wallet");
      return;
    }
    setIsSigning(true);
    try {
      const addr = account.address;
      const { payload, message } = await fetchSiwePayload({
        address: addr,
        purpose: "ticket_qr",
      });
      const signature = await account.signMessage({ message });
      const verified = await fetchSiweVerify({ payload, signature });
      setStoredProof(addr, "ticket_qr", {
        token: verified.proof_token,
        expiresAt: verified.expires_at,
      });
      setProofToken(verified.proof_token);
    } catch (e) {
      console.error(e);
      alert("Failed to sign");
    } finally {
      setIsSigning(false);
    }
  };

  const allRedeemed = canCheckRedeemStatus
    ? allData.every((data) => data?.isRedeemed)
    : tickets.every((t) => t.isRedeemed);
  const anyPending = canCheckRedeemStatus
    ? allData.some((data) => data?.pendingIsRedeemed && !data?.isRedeemed)
    : tickets.some((t) => t.pendingIsRedeemed && !t.isRedeemed);

  function handleBuyMoreClick() {
    setTicketOrder({
      eventId: event.id,
      eventTitle: event.title,
      ticketPrice: event.ticketPrice,
      totalTickets: 1,
      allocations: [],
    });
    navigate("/purchase");
  }

  const ticketCount = tickets.length;
  if (!canCheckRedeemStatus) {
    return (
      <div className="w-full">
        <Button
          className="w-full"
          disabled={hasPassed || isSigning}
          onClick={async () => {
            await signToShowQr();
            setOpen(true);
          }}
        >
          {isSigning ? "Signing..." : "Show tickets"}
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className="w-screen h-screen max-w-screen flex flex-col sm:max-w-screen z-1000 border-black overflow-y-auto"
            aria-describedby={undefined}
          >
            <DialogTitle className="text-center">
              Your Tickets ({ticketCount}){anyPending && <br />}
              {anyPending && "(redeem pending)"}
            </DialogTitle>
            {!proofToken ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="text-muted-foreground">
                  To prevent QR screenshot reuse, tickets use rotating nonces.
                  Sign a message to prove wallet ownership and show your QR
                  codes.
                </p>
                <Button
                  className="w-full max-w-sm"
                  onClick={signToShowQr}
                  disabled={isSigning}
                >
                  {isSigning ? "Signing..." : "Sign to show QR codes"}
                </Button>
              </div>
            ) : (
              <Suspense fallback={<Loader />}>
                <div
                  className={`flex-1 grid ${ticketCount === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"} items-center justify-center justify-items-center gap-5 py-4`}
                >
                  {tickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      proofToken={proofToken}
                    />
                  ))}
                </div>
              </Suspense>
            )}
            <div className="p-4 border-t border-border">
              <Button
                className="w-full"
                onClick={handleBuyMoreClick}
                disabled={hasPassed}
              >
                Buy more tickets
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {allRedeemed ? (
          <Button className="w-full" disabled>
            Tickets redeemed
          </Button>
        ) : (
          <Button className="w-full" disabled={hasPassed}>
            {ticketCount === 1
              ? "Show ticket"
              : `Show ${pluralTickets(ticketCount)}`}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="w-screen h-screen max-w-screen flex flex-col sm:max-w-screen z-1000 border-black overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogTitle className="text-center">
          Your Tickets ({ticketCount}){anyPending && <br />}
          {anyPending && "(redeem pending)"}
        </DialogTitle>
        {!proofToken ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-muted-foreground">
              To prevent QR screenshot reuse, tickets use rotating nonces. Sign a
              message to prove wallet ownership and show your QR codes.
            </p>
            <Button className="w-full max-w-sm" onClick={signToShowQr} disabled={isSigning}>
              {isSigning ? "Signing..." : "Sign to show QR codes"}
            </Button>
          </div>
        ) : (
          <Suspense fallback={<Loader />}>
            <div
              className={`flex-1 grid ${ticketCount === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"} items-center justify-center justify-items-center gap-5 py-4`}
            >
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  proofToken={proofToken}
                />
              ))}
            </div>
          </Suspense>
        )}
        <div className="p-4 border-t border-border">
          <Button
            className="w-full"
            onClick={handleBuyMoreClick}
            disabled={hasPassed}
          >
            Buy more tickets
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
