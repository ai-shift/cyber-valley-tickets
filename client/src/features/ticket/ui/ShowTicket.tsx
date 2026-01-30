import { apiClient } from "@/shared/api";
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
import type { Ticket } from "../model/types";
import { TicketCard } from "./TicketCard";

type ShowTicketProps = {
  tickets: Ticket[];
  hasPassed: boolean;
};

export const ShowTicket: React.FC<ShowTicketProps> = ({
  tickets,
  hasPassed,
}) => {
  const [open, setOpen] = useState(false);
  const wasClosed = useRef<boolean>(false);

  const ticketQueries = useQueries({
    queries: tickets.map((ticket) => ({
      queryFn: () =>
        apiClient.GET("/api/events/{event_id}/tickets/{ticket_id}", {
          params: {
            path: {
              // @ts-ignore: T2561
              event_id: ticket.eventId,
              ticket_id: ticket.id,
            },
          },
        }),
      select: (data: {
        data?: { isRedeemed: boolean; pendingIsRedeemed: boolean };
      }) => data.data,
      queryKey: ["redeemed", ticket.eventId, ticket.id],
      refetchInterval: open ? 1000 : -1,
    })),
  });

  const isLoading = ticketQueries.some((query) => query.isLoading);
  const hasError = ticketQueries.some((query) => query.error);
  const allData = ticketQueries.map((query) => query.data);

  useEffect(() => {
    const anyPendingRedeemed = allData.some(
      (data) => data?.pendingIsRedeemed && !data?.isRedeemed,
    );
    if (anyPendingRedeemed && !wasClosed.current) {
      setOpen(false);
      wasClosed.current = true;
    }
  }, [allData]);

  const allRedeemed = allData.every((data) => data?.isRedeemed);
  const anyPending = allData.some(
    (data) => data?.pendingIsRedeemed && !data?.isRedeemed,
  );

  if (isLoading) return <Loader className="h-8" containerClassName="h-20" />;
  if (hasError || allData.some((data) => !data))
    return (
      <p className="text-center text-red-500 text-xl">
        Can't check your tickets
      </p>
    );

  const ticketCount = tickets.length;

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
              : `Show tickets (${ticketCount})`}
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
        <Suspense fallback={<Loader />}>
          <div
            className={`flex-1 grid ${ticketCount === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"} items-center justify-center justify-items-center gap-5 py-4`}
          >
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </Suspense>
      </DialogContent>
    </Dialog>
  );
};
