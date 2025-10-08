import type { Placemark } from "../model/types";
export const extractPlacemarkId = (placemark: Placemark) => {
  if (placemark.type === "point") {
    return `${placemark.coordinates.lat}-${placemark.coordinates.lng}-${placemark.name}`;
  }
  if (placemark.coordinates[0]) {
    return `${placemark.coordinates[0].lat}-${placemark.coordinates[0].lng}-${placemark.name}`;
  }
  return `${placemark.name}-${placemark.type}`;
};
