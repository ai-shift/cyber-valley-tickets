import type { Event, EventDto } from "@/entities/event";
import type { EventPlace } from "@/entities/place";

import { EventForm } from "@/features/event-form";
import { EventDataProvider } from "./EventDataProvider";

type CreateEventProps = {
  onSubmit: (event: EventDto, placeDepositSize: number) => void;
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
  return (
    <EventForm
      events={events}
      places={places}
      onSumbit={(event) => {
        const place = places.find((p) => `${p.id}` === event.place);
        onSubmit(event, place?.eventDepositSize ?? 0);
      }}
    />
  );
};

export const CreateEvent: React.FC<CreateEventProps> = ({ onSubmit }) => (
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
