import type { OrderTicket } from "@/entities/order";
import { getCurrencySymbol } from "@/shared/lib/web3";

type PurchaseTicketProps = {
  ticket: OrderTicket;
};
export const PurchaseTicket: React.FC<PurchaseTicketProps> = ({ ticket }) => {
  const currency = getCurrencySymbol();

  return (
    <article className="card border-primary/30">
      <h2 className="text-2xl py-2">{ticket.eventTitle}</h2>
      <div className="h-[1px] bg-input/20 my-5" />
      <div className="flex justify-between items-center text-lg">
        <p>Total:</p>
        <p>
          {ticket.ticketPrice} {currency}
        </p>
      </div>
    </article>
  );
};
