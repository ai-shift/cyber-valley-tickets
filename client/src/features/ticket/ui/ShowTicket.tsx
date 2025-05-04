import { Dialog, DialogTrigger, DialogContent } from "@/shared/ui/dialog";
import type { Ticket } from "../model/types";
import QRCode from "react-qr-code";
import { Button } from "@/shared/ui/button";

type ShowTicketProps = {
  ticket: Ticket;
  isOld: boolean;
};
export const ShowTicket: React.FC<ShowTicketProps> = ({ ticket, isOld }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {ticket.isRedeemed ? (
          <Button disabled>Ticket redeemed</Button>
        ) : (
          <Button disabled={isOld}>Show ticket</Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-11/12 sm:max-w-[425px]">
        <div className="flex justify-center items-center py-20">
          <QRCode size={256} value={`${ticket.id}`} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
