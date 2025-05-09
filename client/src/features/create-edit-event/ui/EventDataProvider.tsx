import type { Event } from "@/entities/event";
import type { EventPlace } from "@/entities/place";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { useEventsAndPlaces } from "../api/useEventsAndPlaces";

type EventDataProviderProps = {
  children: (data: {
    events: Event[];
    places: EventPlace[];
  }) => React.ReactNode;
};

export const EventDataProvider: React.FC<EventDataProviderProps> = ({
  children,
}) => {
  const { events, places, isLoading, errors } = useEventsAndPlaces();

  if (isLoading) return <Loader />;
  if (errors.length > 0) return <ErrorMessage errors={errors} />;
  if (!events || !places)
    return (
      <ErrorMessage errors={new Error("Internal error. Try again later.")} />
    );

  return <>{children({ events, places })}</>;
};
