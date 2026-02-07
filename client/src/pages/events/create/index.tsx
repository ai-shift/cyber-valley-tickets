import type { EventDto } from "@/entities/event";

import { useOrderStore } from "@/entities/order";
import { CreateEvent } from "@/features/create-edit-event";
import { PageContainer } from "@/shared/ui/PageContainer";
import { useNavigate } from "react-router";

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { setEventOrder } = useOrderStore();

  function initOrderPurchase(order: EventDto, placeDepositSize: number) {
    setEventOrder(order, placeDepositSize);
    navigate("/purchase");
  }

  return (
    <PageContainer hasBackIcon={false} name="Create event">
      <div className="px-6">
        <CreateEvent onSubmit={initOrderPurchase} />
      </div>
    </PageContainer>
  );
};
