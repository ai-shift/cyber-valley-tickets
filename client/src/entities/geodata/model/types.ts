import type { components } from "@/shared/api";

type BasePlacemark = components["schemas"]["GeoFeature"];

export type LatLng = BasePlacemark["coordinates"][0];

export interface Point extends BasePlacemark {
  type: "point";
  iconUrl: string;
}

export interface Polygon extends BasePlacemark {
  type: "polygon";
  polygon_color: string;
  line_color: string;
}

export interface Line extends BasePlacemark {
  type: "line";
  line_color: string;
}

export type Placemark = Point | Polygon | Line;
