import { eventQueries } from "@/entities/event";
import { placesQueries } from "@/entities/place/api/placesQueries";
import { useQueries } from "@tanstack/react-query";

export const useEventsAndPlaces = () => {
  const [placesResult, eventsResult] = useQueries({
    queries: [placesQueries.list(), eventQueries.list()],
  });

  const isLoading = placesResult.isFetching || eventsResult.isFetching;
  const errors = [placesResult.error, eventsResult.error].filter(
    (error) => error !== null,
  );

  const places = placesResult.data;
  const events = eventsResult.data;

  return { places, events, isLoading, errors };
};
