import type { Event, EventDto } from "@/entities/event";
import type { EventPlace } from "@/entities/place";

import { EventForm } from "@/features/event-form";
import { EventDataProvider } from "./EventDataProvider";

type CreateEventProps = {
  onSubmit: (event: EventDto) => void;
};

type CreateEventWithData = CreateEventProps & {
  events: Event[];
  places: EventPlace[];
};

const CreateEventWithData: React.FC<CreateEventWithData> = ({
  onSubmit,
  events,
  places,
}) => {
  return <EventForm events={events} places={places} onSumbit={onSubmit} />;
};

export const CreateEvent: React.FC<CreateEventProps> = ({ onSubmit }) => {
  return (
    <EventDataProvider>
      {({ events, places }) => (
        <CreateEventWithData
          events={events}
          places={places}
          onSubmit={onSubmit}
        />
      )}
    </EventDataProvider>
  );
};
