import type { Order } from "@/entities/order";
import { Button } from "@/shared/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { purchase } from "../api/purchase";
import { OrderSuccessDialog } from "./OrderSuccessDialog";

type ConfirmPaymentProps = {
  order: Order;
};
export const ConfirmPayment: React.FC<ConfirmPaymentProps> = ({ order }) => {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const { mutate, error } = useMutation({
    mutationFn: purchase,
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  const navigateFn = () => navigate("/", { replace: true });
  const successMessage =
    order.type === "buy_ticket"
      ? "Your will recieve your ticket within 15 minutes."
      : "Your order will be published within 15 minutes.";

  return (
    <article className="card border-primary/30">
      {error ? (
        <div>
          <img
            className="aspect-square h-40 mx-auto my-7"
            src="/icons/price_2.svg"
            alt="purchase"
          />
          <h2 className="text-muted font-semibold text-lg text-center">
            Errors during transaction
          </h2>
          <p className="text-muted/70 text-md text-center">
            Check your wallet for the details or try again later.
          </p>
        </div>
      ) : (
        <div>
          <img
            className="aspect-square h-40 mx-auto my-7"
            src="/icons/price_2.svg"
            alt="purchase"
          />
          <h2 className="text-muted font-semibold text-lg text-center">
            Connect Your Wallet
          </h2>
          <p className="text-muted/70 text-md text-center">
            Connect your Web3 wallet to complete the purchase. You'll be
            prompted to confirm the transaction.
          </p>
        </div>
      )}
      <div className="flex justify-center py-6">
        <span>
          <Button onClick={() => mutate(order)} className="mx-auto">
            Pay with wallet
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
