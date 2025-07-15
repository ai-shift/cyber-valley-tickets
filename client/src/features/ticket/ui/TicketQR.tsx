import { useSuspenseQuery } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import { useGetNonce } from "../api/show";
import type { Ticket } from "../model/types";

type TicketQRProps = {
  ticket: Ticket;
};

export const TicketQR: React.FC<TicketQRProps> = ({ ticket }) => {
  const { data } = useSuspenseQuery(useGetNonce(ticket.eventId, ticket.id));

  // NOTE: Looks weird
  if (data == null) return;

  return (
    <div className="flex justify-center items-center py-20">
      <QRCode
        bgColor="#000000"
        fgColor="#ffffff"
        value={`${ticket.eventId},${ticket.id},${data.nonce}`}
      />
    </div>
  );
};
