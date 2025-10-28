import type { LatLng, Placemark } from "@/entities/geodata";
import { findApproximatePolygonCenter } from "./approximateCenter.ts";

export const getPlacemarkPosition = (mark: Placemark): LatLng | null => {
  if (mark.coordinates.length === 0) {
    return null;
  }
  switch (mark.type) {
    case "point":
      return mark.coordinates[0]!;
    case "polygon":
      return findApproximatePolygonCenter(mark.coordinates);
    case "line":
      return mark.coordinates[Math.floor(mark.coordinates.length / 2)]!;
  }
};
