import type { EventSortFunction } from "../model/types";

import { useQuery } from "@tanstack/react-query";
import { eventQueries } from "@/entities/event";
import { EventsPreview } from "@/widgets/EventsPreview";

type EventsListProps = {
  limit?: number;
  sortFn?: EventSortFunction;
};

export const EventsList: React.FC<EventsListProps> = ({ limit, sortFn }) => {
  const { data, error, isFetching } = useQuery(eventQueries.list());

  console.log(data);

  if (isFetching) return <p>Loading</p>;
  if (error) return <p>{error.message}</p>;
  if (!data?.data) return <p>No data for some reason</p>;

  const events = data.data;

  return <EventsPreview events={events} limit={limit} />;
};
