import type { EventDto } from "@/entities/event";

import { useOrderStore } from "@/entities/order";
// FIXME: Do not import from feature contents directly
import { EventForm } from "@/features/event-form/ui/EventForm";
import { PageContainer } from "@/shared/ui/PageContainer";
import { useNavigate } from "react-router";
import { mockDateRanges, mockEventPlaces } from "../mock";

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
