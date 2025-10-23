import type { EventPlace } from "@/entities/place";
import type { LatLng } from "@/features/map/model/types";

export type EventPlaceForm = Omit<
  EventPlace,
  "id" | "isUsed" | "available" | "locationUrl"
> & {
  available: boolean;
  location: LatLng | null;
};
