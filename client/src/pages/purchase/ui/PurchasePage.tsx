import { useOrderStore } from "@/entities/order";
import { Purchase } from "@/features/purchase";
import { Navigate } from "react-router";

export const PurchasePage: React.FC = () => {
  const { order } = useOrderStore();
  console.log(order);

  if (!order) return <Navigate to="/" />;

  return (
    <div>
      <Purchase />
    </div>
  );
};
