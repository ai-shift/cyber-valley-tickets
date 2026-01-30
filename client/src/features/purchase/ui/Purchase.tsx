import { useOrderStore } from "@/entities/order";
import { useReferralStorage } from "@/features/referral";
import { ReferralManager } from "@/features/referral/ui/ReferralManager";
import { ConfirmPayment } from "./ConfirmPayment";
import { PurchaseEvent } from "./PurchaseEvent";
import { PurchaseTicket } from "./PurchaseTicket";

export const Purchase: React.FC = () => {
  const { order } = useOrderStore();
  const { address: referralAddress } = useReferralStorage();

  return (
    <div className="flex flex-col py-5 px-4 gap-5">
      {order?.type === "buy_ticket" && (
        <>
          <PurchaseTicket ticket={order.ticket} />
          <ReferralManager />
        </>
      )}
      {order?.type === "create_event" && (
        <PurchaseEvent type={order.type} event={order.event} />
      )}
      {order?.type === "update_event" && (
        <PurchaseEvent type={order.type} event={order.event} />
      )}

      {order && (
        <ConfirmPayment
          order={order}
          referralAddress={referralAddress || undefined}
        />
      )}
    </div>
  );
};
