import { useQuery } from "@tanstack/react-query";

import { type Event, eventQueries, type EventDto } from "@/entities/event";
import { placesQueries } from "@/entities/place/api/placesQueries";
import { EventForm } from "@/features/event-form";
import { extractRanges } from "../lib/extractRanges";

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
  const {
    data: places,
    error: placeError,
    isFetching: placeLoading,
  } = useQuery(placesQueries.list());
  const {
    data: events,
    error: eventError,
    isFetching: eventLoading,
  } = useQuery(eventQueries.list());

  if (placeLoading || eventLoading)
    //TODO: Another place with conditional hell. What to do..
    return <p>Loading</p>;
  if (eventError || placeError) return <p>Error</p>;
  if (!places || !events)
    return <p>Guys from tanstack. fix this pls already</p>;

  const dateRanges = extractRanges(events);

  if (editEventId) {
    const foundEvent = events.find((event) => `${event.id}` === editEventId);

    if (!foundEvent) {
      return <p>Event you are trying to edit is not found</p>;
    }

    if (canEdit && !canEdit(foundEvent)) {
      return <p>You have no permission to edit this event</p>;
    }

    return (
      <EventForm
        existingEvent={foundEvent}
        bookedRanges={dateRanges}
        places={places}
        onSumbit={onSubmit}
      />
    );
  }

  return (
    <EventForm bookedRanges={dateRanges} places={places} onSumbit={onSubmit} />
  );
};
