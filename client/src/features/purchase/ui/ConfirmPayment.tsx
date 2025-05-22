import type { Order } from "@/entities/order";
import { Button } from "@/shared/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useActiveAccount } from "thirdweb/react";
import { purchase } from "../api/purchase";
import { OrderSuccessDialog } from "./OrderSuccessDialog";

export type ConfirmPaymentProps = {
  order: Order;
};

export const ConfirmPayment: React.FC<ConfirmPaymentProps> = ({ order }) => {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const account = useActiveAccount();
  if (!account) return <p>Failed to connect wallet</p>;
  const { mutate, error } = useMutation({
    mutationFn: (order: Order) => purchase(account, order),
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: console.error,
  });

  const navigateFn = () => navigate("/", { replace: true });
  const successMessage =
    order.type === "buy_ticket"
      ? "Your will recieve your ticket within several minutes."
      : "Your order will be published within several minutes.";

  return (
    <article className="card border-primary/30">
      {error && <PaymentFailed />}
      <div className="flex justify-center py-6">
        <span>
          <Button onClick={() => mutate(order)} className="mx-auto">
            Confirm
          </Button>
        </span>
      </div>
      <OrderSuccessDialog
        open={isSuccess}
        setOpen={setIsSuccess}
        successMsg={successMessage}
        navigateFn={navigateFn}
      />
    </article>
  );
};

function PaymentFailed() {
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
      <p className="text-muted/70 text-md text-center">
        Check your wallet for the details or try again later.
      </p>
    </div>
  );
}
