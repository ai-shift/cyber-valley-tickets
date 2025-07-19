import { useOrderStore } from "@/entities/order";
import { Purchase } from "@/features/purchase";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Navigate } from "react-router";

export const PurchasePage: React.FC = () => {
  const { order } = useOrderStore();

  if (!order) return <Navigate to="/" />;

  return (
    <PageContainer name="Payment">
      <Purchase />
    </PageContainer>
  );
};
