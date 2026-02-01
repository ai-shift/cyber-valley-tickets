import { useOrderStore } from "@/entities/order";
import type { TicketAllocation } from "@/entities/order";
import { useReferralStorage } from "@/features/referral";
import { ReferralManager } from "@/features/referral/ui/ReferralManager";
import { CategoryAllocation } from "@/features/ticket/ui/CategoryAllocation";
import { useHideFormNav } from "@/shared/widgets/navigation/hooks/useHideFormNav";
import { ConfirmPayment } from "./ConfirmPayment";
import { PurchaseEvent } from "./PurchaseEvent";
import { PurchaseTicket } from "./PurchaseTicket";

export const Purchase: React.FC = () => {
  useHideFormNav();
  const { order, updateTicketAllocations } = useOrderStore();
  const { address: referralAddress } = useReferralStorage();

  const handleAllocationsChange = (allocations: TicketAllocation[]) => {
    updateTicketAllocations(allocations);
  };

  return (
    <div className="flex flex-col py-5 px-4 gap-5">
      {order?.type === "buy_ticket" && (
        <>
          <PurchaseTicket ticket={order.ticket} />
          {/* Category allocation - multi-ticket support */}
          <div className="border border-primary/30 p-4">
            <h3 className="text-lg font-semibold mb-3">Ticket Categories</h3>
            <CategoryAllocation
              eventId={order.ticket.eventId}
              ticketPrice={order.ticket.ticketPrice}
              allocations={order.ticket.allocations}
              onAllocationsChange={handleAllocationsChange}
            />
          </div>
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
