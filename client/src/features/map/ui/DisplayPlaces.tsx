import { type EventPlace, placesQueries } from "@/entities/place";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Circle } from "./components/circle";

type DisplayPlacesProps = {
  additionalPlaces?: EventPlace[];
  removedPlaces?: EventPlace[];
};

export const DisplayPlaces: React.FC<DisplayPlacesProps> = ({
  additionalPlaces,
  removedPlaces,
}) => {
  const [displayedPlaces, setDisplayedPlaces] = useState<EventPlace[]>([]);
  const { data: places } = useQuery(placesQueries.list());

  useEffect(() => {
    if (places != null) {
      setDisplayedPlaces((prev) => [...new Set([...prev, ...places])]);
    }

    if (additionalPlaces != null) {
      setDisplayedPlaces((prev) => [...prev, ...additionalPlaces]);
    }

    if (removedPlaces) {
      setDisplayedPlaces((prev) =>
        prev.filter(({ id }) =>
          !removedPlaces.map((place) => place.id).includes(id)
        ),
      );
    }
  }, [places, additionalPlaces, removedPlaces]);

  return (
    <>
      {displayedPlaces.map((place) => (
        <Circle
          key={place.id}
          center={place.geometry.coordinates[0]}
          radius={50}
          strokeColor="#76ff05"
          fillColor="#76ff05"
        />
      ))}
    </>
  );
};
