import type { Event, EventDto } from "@/entities/event";
import type { EventPlace } from "@/entities/place";
import { EventForm } from "@/features/event-form";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { eventQueries } from "@/entities/event";
import { useQuery } from "@tanstack/react-query";
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

  const {
    data: existingCategories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useQuery({
    ...eventQueries.categories(editEventId),
    enabled: !!foundEvent,
  });

  if (!foundEvent) {
    return (
      <ErrorMessage
        errors={new Error("Event you are trying to edit is not found")}
      />
    );
  }

  if (!canEdit(foundEvent)) {
    return (
      <ErrorMessage
        errors={new Error("You have no permissions to edit this event")}
      />
    );
  }

  if (isCategoriesLoading) return <Loader />;
  if (categoriesError) return <ErrorMessage errors={categoriesError} />;
  if (!existingCategories) return <ErrorMessage errors={categoriesError} />;

  return (
    <EventForm
      existingEvent={foundEvent}
      existingCategories={existingCategories.map((c) => ({
        id: crypto.randomUUID(),
        name: c.name,
        discount: c.discount,
        quota: c.hasQuota ? c.quota : 0,
      }))}
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
