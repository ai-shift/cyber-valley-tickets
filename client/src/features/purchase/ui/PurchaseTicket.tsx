import type { OrderTicket } from "@/entities/order";
import { getCurrencySymbol } from "@/shared/lib/web3";

type PurchaseTicketProps = {
  ticket: OrderTicket;
};

export const PurchaseTicket: React.FC<PurchaseTicketProps> = ({ ticket }) => {
  const displayPrice = ticket.finalPrice ?? ticket.ticketPrice;
  const hasDiscount = ticket.discount && ticket.discount > 0;

  return (
    <article className="card border-primary/30">
      <h2 className="text-2xl py-2">{ticket.eventTitle}</h2>

      {ticket.categoryName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Category:</span>
          <span className="font-medium text-secondary">
            {ticket.categoryName}
          </span>
          {hasDiscount && (
            <span className="text-green-500">
              ({ticket.discount! / 100}% off)
            </span>
          )}
        </div>
      )}

      <div className="h-[1px] bg-input/20 my-5" />

      {hasDiscount && (
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
          <p>Original price:</p>
          <p className="line-through">
            {ticket.ticketPrice}{" "}
            <img
              src={getCurrencySymbol()}
              className="h-4 aspect-square inline"
              alt="currency"
            />
          </p>
        </div>
      )}

      <div className="flex justify-between items-center text-lg">
        <p>Total:</p>
        <p className={hasDiscount ? "text-green-500 font-medium" : ""}>
          {displayPrice}{" "}
          <img
            src={getCurrencySymbol()}
            className="h-6 aspect-square inline"
            alt="currency"
          />
        </p>
      </div>

      {hasDiscount && (
        <div className="mt-3 p-2 bg-green-500/10 text-sm text-green-600">
          You saved {ticket.ticketPrice - displayPrice}{" "}
          <img
            src={getCurrencySymbol()}
            className="h-4 aspect-square inline"
            alt="currency"
          />
        </div>
      )}
    </article>
  );
};
