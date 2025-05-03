import { eventQueries, type EventDto } from "@/entities/event";
import { useOrderStore } from "@/entities/order";
import { placesQueries } from "@/entities/place/api/placesQueries";
import { EventForm } from "@/features/event-form";
import { useQuery } from "@tanstack/react-query";
import { fromUnixTime } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useNavigate } from "react-router";

export const CreateEvent: React.FC = () => {
  const { setEventOrder } = useOrderStore();
  const navigate = useNavigate();

  const {
    data: places,
    error: placeError,
    isFetching: placeLoading,
  } = useQuery(placesQueries.list());
  const {
    data: events,
    error: eventError,
    isFetching: eventLoading,
  } = useQuery(eventQueries.list());

  //TODO: Another place with conditional hell. What to do..
  if (placeLoading || eventLoading) return <p>Loading</p>;
  if (eventError || placeError) return <p>Error</p>;
  if (!places || !events)
    return <p>Guys from tanstack. fix this pls already</p>;

  function proceedToCheckout(event: EventDto) {
    setEventOrder(event);
    navigate("/purchase");
  }

  const dateRanges = events.reduce<DateRange[]>((acc, curr) => {
    const isPending = curr.status === "submitted";
    const isApproved = curr.status === "approved";

    if (!(isPending || isApproved)) return acc;

    const daysInMs = curr.daysAmount * 1000 * 60 * 60 * 24;

    acc.push({
      from: fromUnixTime(curr.startDateTimestamp / 1000),
      to: fromUnixTime((curr.startDateTimestamp + daysInMs) / 1000),
    });
    return acc;
  }, []);

  return (
    <EventForm
      bookedRanges={dateRanges}
      places={places}
      onSumbit={proceedToCheckout}
    />
  );
};
