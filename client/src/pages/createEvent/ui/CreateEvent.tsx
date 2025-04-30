import { EventForm } from "@/features/event-form/ui/EventForm";
import { PageContainer } from "@/shared/ui/PageContainer";
import { mockDateRanges, mockEventPlaces } from "../mock";

export const CreateEvent: React.FC = () => {
  return (
    <PageContainer name="Create event">
      <EventForm bookedRanges={mockDateRanges} places={mockEventPlaces} />
    </PageContainer>
  );
};
