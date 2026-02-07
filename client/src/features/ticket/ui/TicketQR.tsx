import { useSuspenseQuery } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import { useGetNonce } from "../api/show";
import type { Ticket } from "../model/types";

type TicketQRProps = {
  ticket: Ticket;
  userAddress: string;
  enabled: boolean;
};

export const TicketQR: React.FC<TicketQRProps> = ({
  ticket,
  userAddress,
  enabled,
}) => {
  const { data } = useSuspenseQuery(
    useGetNonce(ticket.eventId, ticket.id, userAddress, enabled),
  );

  // NOTE: Looks weird
  if (data == null) return;

  return (
    <div className="flex justify-center items-center py-20">
      <QRCode
        bgColor="#000000"
        fgColor="#76FF05"
        value={`${ticket.eventId},${ticket.id},${data.nonce}`}
      />
    </div>
  );
};
