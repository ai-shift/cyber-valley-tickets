import { eventQueries } from "@/entities/event";
import { placesQueries } from "@/entities/place/";
import { useQueries } from "@tanstack/react-query";

export const useEventsAndPlaces = () => {
  const [placesResult, eventsResult] = useQueries({
    queries: [placesQueries.list(), eventQueries.list()],
  });

  const isLoading = placesResult.isLoading || eventsResult.isLoading;
  const errors = [placesResult.error, eventsResult.error].filter(
    (error) => error !== null,
  );

  return {
    places: placesResult.data
      ? placesResult.data.filter((place) => place.available)
      : undefined,
    events: eventsResult.data,
    isLoading,
    errors,
  };
};
