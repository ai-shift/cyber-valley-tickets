import { Loader } from "@/shared/ui/Loader";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Suspense } from "react";
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
  return (
    <Dialog>
      <DialogTrigger asChild>
        {ticket.isRedeemed ? (
          <Button className="w-full" disabled>Ticket redeemed</Button>
        ) : (
          <Button className="w-full" disabled={hasPassed}>Show ticket</Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-11/12 sm:max-w-96">
        <DialogTitle>Ticket QR code</DialogTitle>
        <Suspense fallback={<Loader />}>
          <TicketQR ticket={ticket} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
};
