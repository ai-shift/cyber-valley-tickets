import type { EventSortFunction } from "../model/types";

import { eventQueries } from "@/entities/event";
import { EventsPreview } from "@/widgets/EventsPreview";
import { useQuery } from "@tanstack/react-query";

type EventsListProps = {
  limit?: number;
  sortFn?: EventSortFunction;
};

// TODO: Rename sort to filter
export const EventsList: React.FC<EventsListProps> = ({ limit, sortFn }) => {
  const { data: events, error, isFetching } = useQuery(eventQueries.list());

  if (isFetching) return <p>Loading</p>;
  if (error) return <p>{error.message}</p>;
  if (!events) return <p>No data for some reason</p>;

  return <EventsPreview events={events} limit={limit} />;
};
