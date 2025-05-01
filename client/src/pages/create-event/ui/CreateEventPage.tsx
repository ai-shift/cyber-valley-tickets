import type { EventFormType } from "@/features/event-form/model/types";

import { EventForm } from "@/features/event-form/ui/EventForm";
import { PageContainer } from "@/shared/ui/PageContainer";
import { mockDateRanges, mockEventPlaces } from "../mock";
import { useOrderStore } from "@/entities/order";

export const CreateEventPage: React.FC = () => {
  const { setEventOrder } = useOrderStore();

  function proceedToCheckout(event: EventFormType) {}

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
