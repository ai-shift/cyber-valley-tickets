import { eventQueries } from "@/entities/event";
import type { Event } from "@/entities/event";
import type { EventPlace } from "@/entities/place";
import { EventCircle, EbaliMap } from "@/features/map";
import { useQuery } from "@tanstack/react-query";
import { InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface PlaceWithEvents extends EventPlace {
  events: Omit<Event, "place">[];
}

type HomeMapProps = {
  className?: string;
};

export const HomeMap: React.FC<HomeMapProps> = ({ className }) => {
  const { data: events } = useQuery(eventQueries.list());
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithEvents | null>(
    null,
  );
  const [searchParams] = useSearchParams();
  const map = useMap();

  const placesWithEvents = (events ?? ([] as Event[]))
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
    }, {});

  useEffect(() => {
    if (!map) {
      return;
    }
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (lat && lng && Number(lat) && Number(lng)) {
      map.panTo({ lat: Number(lat), lng: Number(lng) });
      map.setZoom(16);
      const foundPlace = Object.values(placesWithEvents).find((place) => {
        const coords = place.geometry.coordinates[0];
        return coords?.lat === +lat && coords?.lng === +lng;
      });
      if (foundPlace) {
        setSelectedPlace(foundPlace);
      }
    } else {
      const places = Object.values(placesWithEvents);
      if (places.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        places.forEach((place) => {
          bounds.extend(place.geometry.coordinates[0]);
        });
        map.fitBounds(bounds, { top: 20, right: 20, bottom: 20, left: 20 });
      }
    }

    const clickListener = map.addListener("click", () =>
      setSelectedPlace(null),
    );
    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, searchParams, placesWithEvents]);

  return (
    <EbaliMap
      className={className}
      requireTwoFingerScroll={false}
      layersOpacity={0.3}
    >
      {Object.values(placesWithEvents).map((place) => (
        <EventCircle
          onClick={() => setSelectedPlace(place)}
          key={place.id}
          center={place.geometry.coordinates[0]}
          radius={35}
          fillColor="#76ff05"
          strokeColor="#76ff05"
          strokeWeight={1}
        />
      ))}
      {selectedPlace && (
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
          <p className="text-md text-secondary">{event.description.slice(0, 80)}</p>
          <p className="text-secondary">Some more info here</p>
        </button>
      ))}
    </div>
  );
};
