import { useAuthSlice } from "@/app/providers";
import type { Order } from "@/entities/order";
import type { Socials } from "@/entities/user";
import { useSendTx } from "@/shared/hooks/sendTx";
import { getCurrencySymbol } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { Button } from "@/shared/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
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
    onSuccess: () => {
      setIsSuccess(true);
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

  const successMessage =
    order.type === "buy_ticket"
      ? "Your will recieve your ticket within several minutes."
      : "Your order will be published within several minutes.";

  // Calculate final price for display on button
  const finalPrice =
    order.type === "buy_ticket"
      ? (order.ticket.finalPrice ?? order.ticket.ticketPrice)
      : null;

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
                : finalPrice
                  ? `Pay ${finalPrice}`
                  : "Confirm"}
              {finalPrice && (
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
        onConfirm={() => navigate("/", { replace: true })}
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
