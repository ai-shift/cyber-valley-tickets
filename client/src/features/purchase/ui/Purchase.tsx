import { useOrderStore } from "@/entities/order";
import { PurchaseTicket } from "./PurchaseTicket";
import { PurchaseEvent } from "./PurchaseEvent";
import { ConfirmPayment } from "./ConfirmPayment";

export const Purchase: React.FC = () => {
  const { order } = useOrderStore();

  return (
    <div className="flex flex-col py-5 px-4 gap-5">
      {order?.type === "buy_ticket" && <PurchaseTicket ticket={order.ticket} />}
      {order?.type === "create_event" && <PurchaseEvent event={order.event} />}

      {order && <ConfirmPayment order={order} />}
    </div>
  );
};
