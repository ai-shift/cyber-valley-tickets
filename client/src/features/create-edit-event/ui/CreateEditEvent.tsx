import type { Event, EventDto } from "@/entities/event";
import { EventForm } from "@/features/event-form";
import { extractRanges } from "../lib/extractRanges";
import { useEventsAndPlaces } from "../api/useEventsAndPlaces";
import { Suspense } from "react";

type CreateEditEventBaseProps = {
  onSubmit: (event: EventDto) => void;
};

type CreateEventProps = CreateEditEventBaseProps & {
  editEventId?: undefined;
  canEdit?: undefined;
};

type EditEventProps = CreateEditEventBaseProps & {
  editEventId: string;
  canEdit: (event: Event) => boolean;
};

type CreateEditEventProps = CreateEventProps | EditEventProps;

export const CreateEditEvent: React.FC<CreateEditEventProps> = ({
  editEventId,
  onSubmit,
  canEdit,
}) => {
  const { events, places, isLoading, errors } = useEventsAndPlaces();

  if (isLoading) return <p>Loading</p>;
  if (errors.length > 0) return <p>{errors.toString()}</p>;
  if (!events || !places) return <p>Internal error. Try again later</p>;

  if (editEventId) {
    const foundEvent = events.find((event) => `${event.id}` === editEventId);
    const dateRanges = extractRanges(events, Number(editEventId));

    if (!foundEvent) {
      return <p>Event you are trying to edit is not found</p>;
    }

    if (canEdit && !canEdit(foundEvent)) {
      return <p>You have no permission to edit this event</p>;
    }

    return (
      <Suspense fallback={<p>Loading</p>}>
        <EventForm
          existingEvent={foundEvent}
          bookedRanges={dateRanges}
          places={places}
          onSumbit={onSubmit}
        />
      </Suspense>
    );
  }

  const dateRanges = extractRanges(events);
  return (
    <Suspense fallback={<p>Loading</p>}>
      <EventForm
        bookedRanges={dateRanges}
        places={places}
        onSumbit={onSubmit}
      />
    </Suspense>
  );
};
