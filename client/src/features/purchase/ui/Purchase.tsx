import { useOrderStore } from "@/entities/order";
import type { TicketAllocation } from "@/entities/order";
import { useReferralStorage } from "@/features/referral";
import { ReferralManager } from "@/features/referral/ui/ReferralManager";
import { CategoryAllocation } from "@/features/ticket/ui/CategoryAllocation";
import { useEffect, useState } from "react";
import { ConfirmPayment } from "./ConfirmPayment";
import { PurchaseEvent } from "./PurchaseEvent";
import { PurchaseTicket } from "./PurchaseTicket";

export const Purchase: React.FC = () => {
  const { order, updateTicketAllocations } = useOrderStore();
  const { address: referralAddress } = useReferralStorage();
  const [paymentStage, setPaymentStage] = useState<
    "checkout" | "pending" | "success" | "error"
  >("checkout");

  useEffect(() => {
    // New order should always start from the full checkout view.
    setPaymentStage("checkout");
  }, [order?.type]);

  const handleAllocationsChange = (allocations: TicketAllocation[]) => {
    updateTicketAllocations(allocations);
  };

  return (
    <div className="flex flex-col py-5 px-4 gap-5">
      {order && paymentStage !== "checkout" && (
        <div className="text-center">
          <h2 className="text-lg font-semibold">Payment</h2>
          <p className="text-sm text-muted-foreground">
            {paymentStage === "pending"
              ? "Processing your transaction"
              : paymentStage === "success"
                ? "Payment successful"
                : "Payment failed"}
          </p>
        </div>
      )}

      {order && paymentStage === "error" && (
        <button
          type="button"
          className="text-sm underline underline-offset-2 mx-auto"
          onClick={() => setPaymentStage("checkout")}
        >
          Back to checkout
        </button>
      )}

      {order?.type === "buy_ticket" && paymentStage === "checkout" && (
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
      {order?.type === "create_event" && paymentStage === "checkout" && (
        <PurchaseEvent
          type={order.type}
          event={order.event}
          placeDepositSize={order.placeDepositSize}
        />
      )}
      {order?.type === "update_event" && paymentStage === "checkout" && (
        <PurchaseEvent type={order.type} event={order.event} />
      )}

      {order && (
        <ConfirmPayment
          order={order}
          referralAddress={referralAddress || undefined}
          onStageChange={setPaymentStage}
        />
      )}
    </div>
  );
};
