import type { OrderTicket } from "@/entities/order";

type PurchaseTicketProps = {
  ticket: OrderTicket;
};

export const PurchaseTicket: React.FC<PurchaseTicketProps> = ({ ticket }) => {
  return (
    <article className="card border-primary/30">
      <h2 className="text-2xl py-2">{ticket.eventTitle}</h2>
    </article>
  );
};
