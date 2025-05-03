import { useQuery } from "@tanstack/react-query";

import { eventQueries, type EventDto } from "@/entities/event";
import { placesQueries } from "@/entities/place/api/placesQueries";
import { EventForm } from "@/features/event-form";
import { extractRanges } from "../lib/extractRanges";

type CreateEditEventProps = {
  editEventId?: string;
  onSubmit: (event: EventDto) => void;
};

export const CreateEditEvent: React.FC<CreateEditEventProps> = ({
  editEventId,
  onSubmit,
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

  //TODO: Another place with conditional hell. What to do..
  if (placeLoading || eventLoading) return <p>Loading</p>;
  if (eventError || placeError) return <p>Error</p>;
  if (!places || !events)
    return <p>Guys from tanstack. fix this pls already</p>;

  const dateRanges = extractRanges(events);

  const eventForEdit = editEventId
    ? events.find((event) => `${event.id}` === editEventId)
    : undefined;

  return (
    <EventForm
      existingEvent={eventForEdit}
      bookedRanges={dateRanges}
      places={places}
      onSumbit={onSubmit}
    />
  );
};
