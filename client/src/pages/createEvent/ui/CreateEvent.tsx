import { EventForm } from "@/entities/event/ui/EventForm";
import { mockDateRanges, mockEventPlaces } from "../mock";

export const CreateEvent: React.FC = () => {
  return (
    <div>
      <EventForm bookedRanges={mockDateRanges} places={mockEventPlaces} />
    </div>
  );
};
