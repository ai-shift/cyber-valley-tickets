import type { EventDto } from "@/entities/event";
import { getCurrencySymbol, getEventSubmitionPrice } from "@/shared/lib/web3";

type PurchaseEventProps = {
  event: EventDto;
};
export const PurchaseEvent: React.FC<PurchaseEventProps> = ({ event }) => {
  const currency = getCurrencySymbol();
  const createEventFee = getEventSubmitionPrice();

  return (
    <article className="card border-primary/30">
      <h2 className="text-2xl py-2">{event.title}</h2>
      <div className="h-[1px] bg-input/20 my-5" />
      <div className="flex justify-between items-center text-lg">
        <p>Total:</p>
        <p>
          {createEventFee} {currency}
        </p>
      </div>
    </article>
  );
};
