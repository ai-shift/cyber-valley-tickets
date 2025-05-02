import { eventQueries } from "@/entities/event";
import { userQueries } from "@/entities/user/api/userQueries";
import { EventsPreview } from "@/widgets/EventsPreview";
import { useQuery } from "@tanstack/react-query";

import { filter } from "../lib/filter";

type EventsListProps = {
  limit?: number;
};

export const EventsList: React.FC<EventsListProps> = ({ limit }) => {
  const { data: events, error, isFetching } = useQuery(eventQueries.list());
  const { data: user } = useQuery(userQueries.current());

  //TODO optimize conditional rendering logic
  if (isFetching) return <p>Loading</p>;
  if (error) return <p>{error.message}</p>;
  if (!events || !user) return <p>No data for some reason</p>;

  const displayEvents = events.filter((event) => filter(event, user));

  return <EventsPreview events={displayEvents} limit={limit} />;
};
