import { useOrderStore } from "@/entities/order";
import { Navigate } from "react-router";

export const PurchasePage: React.FC = () => {
  const { order } = useOrderStore();

  if (!order) return <Navigate to="/" />;

  return (
    <div>
      <h2 className="text-5xl text-center py-30">{order.type}</h2>
    </div>
  );
};
