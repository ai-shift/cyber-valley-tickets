import type { Event, EventDto } from "@/entities/event";
import type { EventPlace } from "@/entities/place";
import { EventForm } from "@/features/event-form";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
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

  if (!foundEvent) {
    return (
      <ErrorMessage
        errors={new Error("Event you are trying to edit is not found")}
      />
    );
  }

  if (canEdit && !canEdit(foundEvent)) {
    return (
      <ErrorMessage
        errors={new Error("You have no permissions to edit this event")}
      />
    );
  }

  return (
    <EventForm
      existingEvent={foundEvent}
      events={events}
      places={places}
      onSumbit={onSubmit}
    />
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
