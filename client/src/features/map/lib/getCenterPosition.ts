import type { Placemark } from "../model/types.ts";
import { findApproximatePolygonCenter } from "./approximateCenter.ts";

export const getPlacemarkPosition = (mark: Placemark) => {
  switch (mark.type) {
    case "point":
      return mark.coordinates;
    case "polygon":
      return findApproximatePolygonCenter(mark.coordinates);
    case "line":
      return mark.coordinates[Math.floor(mark.coordinates.length / 2)];
  }
};
