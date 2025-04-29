import { eventQueries } from "@/entities/event";
import { EventsPreview } from "@/widgets/EventsPreview";
import { useQuery } from "@tanstack/react-query";

type EventsListProps = {
  limit?: number;
};

export const EventsList: React.FC<EventsListProps> = ({ limit }) => {
  const { data, error, isFetching } = useQuery(eventQueries.list());

  if (isFetching) return <p>Loading</p>;
  if (error) return <p>{error.message}</p>;
  if (!data?.data) return <p>No data for some reason</p>;

  const events = data.data;

  return <EventsPreview events={events} limit={limit} />;
};
