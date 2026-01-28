import { eventQueries } from "@/entities/event";
import type { Event } from "@/entities/event";
import type { EventPlace } from "@/entities/place";
import { EbaliMap, useMapState } from "@/features/map";
import { useQuery } from "@tanstack/react-query";
import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";

interface PlaceWithEvents extends EventPlace {
  events: Omit<Event, "place">[];
}

export const HomeMap: React.FC = () => {
  const map = useMap();
  const [searchParams] = useSearchParams();
  const hasInitialized = useRef(false);

  const { data: events } = useQuery(eventQueries.list());
  const { selectEventPlace, setEventLayer } = useMapState();

  const approvedEvents = useMemo(
    () =>
      (events ?? ([] as Event[])).filter(
        (event) => event.status === "approved",
      ),
    [events],
  );

  const placesWithEvents = useMemo(
    () =>
      approvedEvents.reduce<Record<number, PlaceWithEvents>>((acc, event) => {
        const { place } = event;
        const placeId = place.id;
        const { place: _, ...eventWithoutPlace } = event;

        if (!acc[placeId]) {
          acc[placeId] = {
            ...place,
            events: [],
          };
        }

        acc[placeId].events.push(eventWithoutPlace as Omit<Event, "place">);
        return acc;
      }, {}),
    [approvedEvents],
  );

  useEffect(() => {
    setEventLayer(placesWithEvents, approvedEvents);
  }, [approvedEvents, placesWithEvents, setEventLayer]);

  useEffect(() => {
    if (!map || hasInitialized.current) {
      return;
    }

    const places = Object.values(placesWithEvents);
    if (places.length === 0) {
      return;
    }

    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (lat && lng && Number(lat) && Number(lng)) {
      map.panTo({ lat: Number(lat), lng: Number(lng) });
      map.setZoom(16);
      const foundPlace = places.find((place) => {
        const coords = place.geometry.coordinates[0];
        return coords?.lat === +lat && coords?.lng === +lng;
      });
      if (foundPlace) {
        selectEventPlace(foundPlace.id);
      }
    }
    hasInitialized.current = true;
  }, [map, placesWithEvents, searchParams]);

  return (
    <EbaliMap
      className="h-full relative"
      requireTwoFingerScroll={false}
      layersOpacity={0.4}
    />
  );
};
