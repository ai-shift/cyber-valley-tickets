import { type Event, eventQueries } from "@/entities/event";
import { userQueries } from "@/entities/user/api/userQueries";
import { EventsPreview } from "@/widgets/EventsPreview";
import { useQuery } from "@tanstack/react-query";

import type { User } from "@/entities/user";

type EventsListProps = {
  limit?: number;
  filterFn?: (event: Event, user: User) => boolean;
};

export const EventsList: React.FC<EventsListProps> = ({ limit, filterFn }) => {
  const { data: events, error, isFetching } = useQuery(eventQueries.list());
  const { data: user } = useQuery(userQueries.current());

  //TODO optimize conditional rendering logic
  if (isFetching) return <p>Loading</p>;
  if (error) return <p>{error.message}</p>;
  if (!events || !user) return <p>No data for some reason</p>;

  const displayEvents = filterFn
    ? events.filter((event) => filterFn(event, user))
    : events;

  return <EventsPreview events={displayEvents} limit={limit} />;
};
