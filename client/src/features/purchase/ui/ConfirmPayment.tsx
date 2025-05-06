import type { Order } from "@/entities/order";
import { Button } from "@/shared/ui/button";
import { useMutation } from "@tanstack/react-query";
import { purchase } from "../api/purchase";

type ConfirmPaymentProps = {
  order: Order;
};
export const ConfirmPayment: React.FC<ConfirmPaymentProps> = ({ order }) => {
  const { mutate } = useMutation({
    mutationFn: purchase,
  });

  return (
    <article className="card border-primary/30">
      <img
        className="aspect-square h-40 mx-auto my-7"
        src="/icons/price_2.svg"
        alt="purchase"
      />
      <h2 className="text-muted font-semibold text-lg text-center">
        Connect Your Wallet
      </h2>
      <p className="text-muted/70 text-md text-center">
        Connect your Web3 wallet to complete the purchase. You'll be prompted to
        confirm the transaction.
      </p>
      <div className="flex justify-center py-6">
        <span>
          <Button onClick={() => mutate(order)} className="mx-auto">
            Pay with wallet
          </Button>
        </span>
      </div>
    </article>
  );
};
