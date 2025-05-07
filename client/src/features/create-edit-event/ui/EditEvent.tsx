import type { Event, EventDto } from "@/entities/event";
import type { EventPlace } from "@/entities/place";
import { EventForm } from "@/features/event-form";
import { extractRanges } from "../lib/extractRanges";
import { EventDataProvider } from "./EventDataProvider";

type EditEventProps = {
  editEventId: number;
  onSubmit: (event: EventDto) => void;
  canEdit: (event: Event) => boolean;
};

type EditEventsWithDataProps = EditEventProps & {
  events: Event[];
  places: EventPlace[];
};

const EditEventWithData: React.FC<EditEventsWithDataProps> = ({
  onSubmit,
  editEventId,
  canEdit,
  events,
  places,
}) => {
  const foundEvent = events.find((event) => event.id === editEventId);
  const dateRanges = extractRanges(events, Number(editEventId));

  if (!foundEvent) {
    return <p>Event you are trying to edit is not found</p>;
  }

  if (canEdit && !canEdit(foundEvent)) {
    return <p>You have no permission to edit this event</p>;
  }

  return (
    <EventForm bookedRanges={dateRanges} places={places} onSumbit={onSubmit} />
  );
};

export const EditEvent: React.FC<EditEventProps> = ({
  onSubmit,
  editEventId,
  canEdit,
}) => {
  return (
    <EventDataProvider>
      {({ events, places }) => (
        <EditEventWithData
          events={events}
          places={places}
          onSubmit={onSubmit}
          canEdit={canEdit}
          editEventId={editEventId}
        />
      )}
    </EventDataProvider>
  );
};
