import { Dialog, DialogTrigger, DialogContent } from "@/shared/ui/dialog";
import type { Ticket } from "../model/types";
import QRCode from "react-qr-code";
import { Button } from "@/shared/ui/button";

type ShowTicketProps = {
  ticket: Ticket;
  hasPassed: boolean;
};
export const ShowTicket: React.FC<ShowTicketProps> = ({ ticket, hasPassed }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {ticket.isRedeemed ? (
          <Button disabled>Ticket redeemed</Button>
        ) : (
          <Button disabled={hasPassed}>Show ticket</Button>
        )}
      </DialogTrigger>
      {/* TODO: Use rem insted of px */}
      <DialogContent className="w-11/12 sm:max-w-[425px]">
        <div className="flex justify-center items-center py-20">
          <QRCode size={256} value={`${ticket.id}`} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
