import { apiClient } from "@/shared/api";
import { Loader } from "@/shared/ui/Loader";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState } from "react";
import type { Ticket } from "../model/types";
import { TicketQR } from "./TicketQR";

type ShowTicketProps = {
  ticket: Ticket;
  hasPassed: boolean;
};

export const ShowTicket: React.FC<ShowTicketProps> = ({
  ticket,
  hasPassed,
}) => {
  const [open, setOpen] = useState(false);
  const wasClosed = useRef<boolean>(false);

  const { isLoading, error, data } = useQuery({
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
    select: (data) => data.data,
    queryKey: ["redeemed", ticket.eventId, ticket.id],
    refetchInterval: open ? 1000 : -1,
  });

  useEffect(() => {
    if (data?.pendingIsRedeemed && !wasClosed.current) {
      setOpen(false);
      wasClosed.current = true;
    }
  }, [data?.pendingIsRedeemed]);

  if (isLoading) return <Loader className="h-8" containerClassName="h-20" />;
  if (!data || error)
    return (
      <p className="text-center text-red-500 text-xl">
        Can't check your ticket
      </p>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {data.isRedeemed ? (
          <Button className="w-full" disabled>
            Ticket redeemed
          </Button>
        ) : (
          <Button className="w-full" disabled={hasPassed}>
            Show ticket
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-11/12 sm:max-w-96">
        <DialogTitle>
          Ticket QR code <br />{" "}
          {data.pendingIsRedeemed && !data.isRedeemed && "(redeem pending)"}
        </DialogTitle>
        <Suspense fallback={<Loader />}>
          <TicketQR ticket={ticket} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
};
