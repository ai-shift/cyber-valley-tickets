import { eventQueries } from "@/entities/event";
import type { Event } from "@/entities/event";
import type { EventPlace } from "@/entities/place";
import { EbaliMap } from "@/features/map";
import { useQuery } from "@tanstack/react-query";
import {
  AdvancedMarker,
  InfoWindow,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface PlaceWithEvents extends EventPlace {
  events: Omit<Event, "place">[];
}

export const HomeMap: React.FC = () => {
  const { data: events } = useQuery(eventQueries.list());
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithEvents | null>(
    null,
  );
  const [searchParams] = useSearchParams();
  const map = useMap();
  const hasInitialized = useRef(false);

  const placesWithEvents = useMemo(
    () =>
      (events ?? ([] as Event[]))
        .filter((event) => event.status === "approved")
        .reduce<Record<number, PlaceWithEvents>>((acc, event) => {
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
    [events],
  );

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
        setSelectedPlace(foundPlace);
      }
    }
    hasInitialized.current = true;
  }, [map, placesWithEvents, searchParams]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const clickListener = map.addListener("click", () =>
      setSelectedPlace(null),
    );
    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map]);

  return (
    <EbaliMap
      className="h-full relative"
      requireTwoFingerScroll={false}
      layersOpacity={0.4}
    >
      {Object.values(placesWithEvents).map((place) => {
        const coord = place.geometry.coordinates[0];
        if (!coord) return null;
        return (
          <AdvancedMarker
            onClick={() => setSelectedPlace(place)}
            key={place.id}
            position={coord}
          >
            <Pin
              background={"#76FF05"}
              borderColor={"#000000"}
              glyphColor={"#000000"}
              scale={2}
            />
          </AdvancedMarker>
        );
      })}
      {selectedPlace?.geometry.coordinates[0] && (
        <InfoWindow
          headerDisabled
          position={selectedPlace.geometry.coordinates[0]}
        >
          <h2 className="text-primary text-lg">{selectedPlace.title}</h2>
          <ListEvents events={selectedPlace.events} />
        </InfoWindow>
      )}
    </EbaliMap>
  );
};

type ListEventsProps = {
  events: Omit<Event, "place">[];
};

const ListEvents: React.FC<ListEventsProps> = ({ events }) => {
  const navigate = useNavigate();

  return (
    <div className="divide-y-[1px] divide-primary">
      {events.map((event) => (
        <button
          key={event.id}
          className="my-1 block text-start"
          onClick={() => navigate(`/events/${event.id}`)}
          type="button"
        >
          <h3 className="text-xl text-secondary">{event.title}</h3>
          <p className="text-md text-secondary">
            {event.description.slice(0, 80)}
          </p>
          <p className="text-secondary">Some more info here</p>
        </button>
      ))}
    </div>
  );
};
