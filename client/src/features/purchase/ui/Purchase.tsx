import { useOrderStore } from "@/entities/order";
import { useReferralStorage } from "@/features/referral";
import { ReferralManager } from "@/features/referral/ui/ReferralManager";
import { CategorySelect } from "@/features/ticket/ui/CategorySelect";
import { useHideFormNav } from "@/shared/widgets/navigation/hooks/useHideFormNav";
import { ConfirmPayment } from "./ConfirmPayment";
import { PurchaseEvent } from "./PurchaseEvent";
import { PurchaseTicket } from "./PurchaseTicket";

import type { CategoryOption } from "@/features/ticket/ui/CategorySelect";

export const Purchase: React.FC = () => {
  useHideFormNav();
  const { order, setTicketOrder } = useOrderStore();
  const { address: referralAddress } = useReferralStorage();

  // Handle category selection and update the order
  const handleCategorySelect = (category: CategoryOption | null) => {
    if (order?.type === "buy_ticket") {
      const ticket = order.ticket;
      const finalPrice = category
        ? ticket.ticketPrice - (ticket.ticketPrice * category.discount) / 10000
        : ticket.ticketPrice;

      setTicketOrder({
        eventId: ticket.eventId,
        eventTitle: ticket.eventTitle,
        ticketPrice: ticket.ticketPrice,
        categoryId: category?.categoryId,
        categoryName: category?.name,
        discount: category?.discount,
        finalPrice: finalPrice,
      });
    }
  };

  return (
    <div className="flex flex-col py-5 px-4 gap-5">
      {order?.type === "buy_ticket" && (
        <>
          <PurchaseTicket ticket={order.ticket} />
          {/* Category selection - only show if event has categories */}
          <div className="card border-primary/30">
            <h3 className="text-lg font-semibold mb-3">Ticket Category</h3>
            <CategorySelect
              eventId={order.ticket.eventId}
              ticketPrice={order.ticket.ticketPrice}
              selectedCategoryId={order.ticket.categoryId ?? null}
              onCategorySelect={handleCategorySelect}
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
