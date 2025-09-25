import { type Event, eventQueries } from "@/entities/event";
import { useQuery } from "@tanstack/react-query";
import { EventCard } from "./EventCard";

import { useAuthSlice } from "@/app/providers";
import type { User } from "@/entities/user";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";

type EventsListProps = {
  limit?: number;
  filterFn?: (event: Event, user: User) => boolean;
};

export const EventsList: React.FC<EventsListProps> = ({ limit, filterFn }) => {
  const { data: events, error, isLoading } = useQuery(eventQueries.list());
  const { user } = useAuthSlice();

  const maybeUser = user ?? ({ role: "customer" } as User);

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage errors={error} />;
  if (!events) return <p>No data for some reason</p>;

  const displayEvents = filterFn
    ? events.filter((event) => filterFn(event, maybeUser))
    : events;
  const limitedEvents = limit ? displayEvents.slice(0, limit) : displayEvents;

  if (limitedEvents.length <= 0) {
    return <p className="text-center text-secondary/60">No events!</p>;
  }

  return (
    <div className={"flex flex-col gap-6 px-3 pb-24"}>
      {limitedEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};
