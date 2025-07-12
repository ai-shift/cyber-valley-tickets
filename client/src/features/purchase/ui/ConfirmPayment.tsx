import type { Order } from "@/entities/order";
import { useSendTx } from "@/shared/hooks/sendTx";
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
};

export const ConfirmPayment: React.FC<ConfirmPaymentProps> = ({ order }) => {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const account = useActiveAccount();
  const { sendTx, data: txHash, error } = useSendTx();
  if (!account) return <p>Failed to connect wallet</p>;
  const { mutate, isPending } = useMutation({
    mutationFn: (order: Order) => purchase(sendTx, account, order),
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: console.error,
  });

  let successMessage =
    order.type === "buy_ticket"
      ? "Your will recieve your ticket within several minutes."
      : "Your order will be published within several minutes.";

  if (txHash != null) {
    successMessage += `\ntx hash: ${txHash}`;
  }

  return (
    <article className="card border-primary/30">
      {error && <PaymentFailed cause={error} />}
      {isPending ? (
        <Loader />
      ) : (
        <div className="flex justify-center py-6">
          <span>
            <Button onClick={() => mutate(order)} className="mx-auto">
              {error ? "Try again" : "Confirm"}
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
