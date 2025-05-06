import { useOrderStore } from "@/entities/order";
import { PurchaseTicket } from "./PurchaseTicket";

export const Purchase: React.FC = () => {
  const { order } = useOrderStore();

  return (
    <div className="flex flex-col py-5 px-4">
      {order?.type === "buy_ticket" && <PurchaseTicket ticket={order.ticket} />}
    </div>
  );
};
