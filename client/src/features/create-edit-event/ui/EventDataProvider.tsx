import type { EventPlace } from "@/entities/place";
import type { Event } from "@/entities/event";
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

  if (isLoading) return <p>Loading…</p>;
  if (errors.length > 0) return <p>{errors.toString()}</p>;
  if (!events || !places) return <p>Internal error. Try again later.</p>;

  return <>{children({ events, places })}</>;
};
