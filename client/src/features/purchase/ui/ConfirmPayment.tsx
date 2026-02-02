import { useAuthSlice } from "@/app/providers";
import { eventQueries } from "@/entities/event";
import type { Order } from "@/entities/order";
import type { Socials } from "@/entities/user";
import { useSendTx } from "@/shared/hooks/sendTx";
import { getCurrencySymbol } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { Button } from "@/shared/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";
import { purchase } from "../api/purchase";

export type ConfirmPaymentProps = {
  order: Order;
  referralAddress?: string;
};

export const ConfirmPayment: React.FC<ConfirmPaymentProps> = ({
  order,
  referralAddress,
}) => {
  const navigate = useNavigate();
  const account = useActiveAccount();
  const { user } = useAuthSlice();
  const { sendTx, data: txHash, error } = useSendTx();
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectEventId, setRedirectEventId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const resolveCreatedEventId = useCallback(async () => {
    if (!user || order.type !== "create_event") return null;
    const events = await queryClient.fetchQuery(eventQueries.list());
    if (!events) return null;
    const targetPlaceId = Number(order.event.place);
    const eventsArray = Array.isArray(events) ? events : [];
    const matchedEvent = eventsArray.find(
      (event: {
        creator: { address: string };
        title: string;
        startDateTimestamp: number;
        place: { id: number };
        ticketPrice: number;
        daysAmount: number;
        id?: number;
      }) => {
        return (
          event.creator.address === user.address &&
          event.title === order.event.title &&
          event.startDateTimestamp === order.event.startTimeTimeStamp &&
          event.place.id === targetPlaceId &&
          event.ticketPrice === order.event.ticketPrice &&
          event.daysAmount === order.event.daysAmount
        );
      },
    );
    return matchedEvent?.id ?? null;
  }, [order, queryClient, user]);

  const { mutate, isPending } = useMutation({
    mutationFn: (order: Order) => {
      if (!account || !user) {
        return Promise.reject("Account or user are missing");
      }
      return purchase(
        sendTx,
        account,
        order,
        user.socials[0] as Socials,
        referralAddress,
      );
    },
    onSuccess: async () => {
      setIsSuccess(true);
      if (order.type === "buy_ticket") {
        setRedirectEventId(order.ticket.eventId);
        return;
      }
      if (order.type === "update_event") {
        setRedirectEventId(order.event.id);
        return;
      }
      if (order.type === "create_event") {
        const createdId = await resolveCreatedEventId();
        if (createdId != null) {
          setRedirectEventId(createdId);
        }
      }
    },
    onError: console.error,
  });

  if (!user) return null;
  if (user.socials.length === 0)
    return (
      <div className="flex flex-col items-center gap-2 py-5">
        <p className="text-lg">No socials are provided</p>
        <Button onClick={() => navigate("/socials")}>Set socials</Button>
      </div>
    );

  const handleConfirm = async () => {
    let nextRedirectId = redirectEventId;
    if (order.type === "create_event" && nextRedirectId == null) {
      const createdId = await resolveCreatedEventId();
      if (createdId != null) {
        setRedirectEventId(createdId);
        nextRedirectId = createdId;
      }
    }

    if (nextRedirectId != null) {
      queryClient.invalidateQueries({
        queryKey: ["events", "lists", nextRedirectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["events", nextRedirectId, "attendees"],
      });
      navigate(`/events/${nextRedirectId}`, { replace: true });
      return;
    }

    navigate("/", { replace: true });
  };

  const successMessage =
    order.type === "buy_ticket"
      ? "Your will recieve your ticket within several minutes."
      : "Your order will be published within several minutes.";

  // Calculate total price and ticket count for display
  const { totalPrice, totalTickets } =
    order.type === "buy_ticket"
      ? {
          totalPrice: order.ticket.allocations.reduce(
            (sum, a) => sum + a.count * a.finalPricePerTicket,
            0,
          ),
          totalTickets: order.ticket.allocations.reduce(
            (sum, a) => sum + a.count,
            0,
          ),
        }
      : { totalPrice: null, totalTickets: null };

  return (
    <article className="card border-primary/30">
      {error && <PaymentFailed cause={error} />}
      {isPending ? (
        <Loader />
      ) : (
        <div className="flex justify-center py-6">
          <span>
            <Button onClick={() => mutate(order)} className="mx-auto">
              {error
                ? "Try again"
                : totalPrice !== null
                  ? `Pay ${totalPrice} (${totalTickets} ${totalTickets === 1 ? "ticket" : "tickets"})`
                  : "Confirm"}
              {totalPrice !== null && (
                <img
                  src={getCurrencySymbol()}
                  className="h-4 aspect-square inline ml-1"
                  alt="currency"
                />
              )}
            </Button>
          </span>
        </div>
      )}
      <ResultDialog
        open={isSuccess}
        setOpen={setIsSuccess}
        title="Payment successful!"
        body={successMessage}
        onConfirm={handleConfirm}
        txHash={txHash as string}
      />
    </article>
  );
};

type PaymentFailedProps = {
  cause: Error;
};

function PaymentFailed({ cause }: PaymentFailedProps) {
  let errorMessage = "Unexpected failure of transaction sending";
  if (cause.message.includes("Not enough tokens")) {
    errorMessage = "Not enough tokens";
  }
  return (
    <div>
      <img
        className="aspect-square h-40 mx-auto my-7"
        src="/icons/price_1.svg"
        alt="purchase"
      />
      <h2 className="text-muted font-semibold text-lg text-center">
        Error during transaction
      </h2>
      <p className="text-muted/70 text-md text-center">{errorMessage}</p>
    </div>
  );
}
