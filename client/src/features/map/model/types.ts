export interface LatLng {
  lat: number;
  lng: number;
}

interface BasePlacemark {
  name: string;
  type: "point" | "polygon" | "line";
}

export interface Point extends BasePlacemark {
  type: "point";
  coordinates: LatLng;
  iconUrl: string;
}

export interface Polygon extends BasePlacemark {
  type: "polygon";
  coordinates: LatLng[];
  polygon_color: string;
  line_color: string;
}

export interface Line extends BasePlacemark {
  type: "line";
  coordinates: LatLng[];
  line_color: string;
}

export type Placemark = Point | Polygon | Line;
