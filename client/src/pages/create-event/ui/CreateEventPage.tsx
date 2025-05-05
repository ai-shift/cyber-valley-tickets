import type { EventDto } from "@/entities/event";

import { useOrderStore } from "@/entities/order";
import { CreateEditEvent } from "@/features/create-edit-event";
import { PageContainer } from "@/shared/ui/PageContainer";
import { useNavigate } from "react-router";

// TODO: @scipunch review
export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { setEventOrder } = useOrderStore();

  function initOrderPurchase(order: EventDto) {
    setEventOrder(order);
    navigate("/socials");
  }

  return (
    <PageContainer name="Create event">
      <CreateEditEvent onSubmit={initOrderPurchase} />
    </PageContainer>
  );
};
