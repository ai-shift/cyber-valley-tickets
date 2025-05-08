import type { EventDto } from "@/entities/event";
import { getCurrencySymbol, getEventSubmitionPrice } from "@/shared/lib/web3";

type PurchaseEventProps = {
  event: EventDto;
  type: "create_event" | "update_event";
};
export const PurchaseEvent: React.FC<PurchaseEventProps> = ({
  event,
  type,
}) => {
  const currency = getCurrencySymbol();
  const createEventFee = getEventSubmitionPrice();

  return (
    <article className="card border-primary/30">
      <h2 className="text-2xl py-2">{event.title}</h2>
      <div className="h-[1px] bg-input/20 my-5" />
      {type === "create_event" ? (
        <div className="flex justify-between items-center text-lg">
          <p>Total:</p>
          <p>
            {createEventFee} {currency}
          </p>
        </div>
      ) : (
        <p className="text-primary">Event is already payed</p>
      )}
    </article>
  );
};
