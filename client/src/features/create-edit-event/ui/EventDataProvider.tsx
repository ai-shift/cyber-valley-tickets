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
  if (!events || !places) return <p>Internal error. Try again later.</p>;

  return <>{children({ events, places })}</>;
};
