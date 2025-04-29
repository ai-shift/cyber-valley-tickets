import { EventForm } from "@/entities/event/ui/EventForm";
import { mockDateRanges, mockEventPlaces } from "../mock";
import { PageContainer } from "@/shared/ui/PageContainer";

export const CreateEvent: React.FC = () => {
  return (
    <PageContainer name="Create event">
      <EventForm bookedRanges={mockDateRanges} places={mockEventPlaces} />
    </PageContainer>
  );
};
