import type { EventDto } from "@/entities/event";

import { EventForm } from "@/features/event-form/ui/EventForm";
import { PageContainer } from "@/shared/ui/PageContainer";
import { mockDateRanges, mockEventPlaces } from "../mock";
import { useOrderStore } from "@/entities/order";
import { useNavigate } from "react-router";

export const CreateEventPage: React.FC = () => {
  const { setEventOrder } = useOrderStore();
  const navigate = useNavigate();

  function proceedToCheckout(event: EventDto) {
    setEventOrder(event);
    navigate("/purchase");
  }

  return (
    <PageContainer name="Create event">
      <EventForm
        bookedRanges={mockDateRanges}
        places={mockEventPlaces}
        onSumbit={proceedToCheckout}
      />
    </PageContainer>
  );
};
