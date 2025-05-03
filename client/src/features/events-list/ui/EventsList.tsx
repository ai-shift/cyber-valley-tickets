import { type Event, eventQueries } from "@/entities/event";
import { useUser } from "@/entities/user";
import { useQuery } from "@tanstack/react-query";
import { EventCard } from "./EventCard";

import type { User } from "@/entities/user";

type EventsListProps = {
  limit?: number;
  filterFn?: (event: Event, user: User) => boolean;
};

export const EventsList: React.FC<EventsListProps> = ({ limit, filterFn }) => {
  const { data: events, error, isFetching } = useQuery(eventQueries.list());
  const { user } = useUser();

  //TODO optimize conditional rendering logic
  if (isFetching) return <p>Loading</p>;
  if (error) return <p>{error.message}</p>;
  if (!(events && user)) return <p>No data for some reason</p>;

  const displayEvents = filterFn
    ? events.filter((event) => filterFn(event, user))
    : events;
  const limitedEvents = limit ? displayEvents.slice(0, limit) : displayEvents;

  return (
    <div>
      {limitedEvents.map((event) => (
        <EventCard key={event.id} event={event} user={user} />
      ))}
    </div>
  );
};
