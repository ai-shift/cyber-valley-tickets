import type { Placemark } from "@/entities/geodata";

export const extractPlacemarkId = (placemark: Placemark) => {
  if (placemark.coordinates[0]) {
    return `${placemark.coordinates[0].lat}-${placemark.coordinates[0].lng}-${placemark.name}`;
  }
  return `${placemark.name}-${placemark.type}`;
};
