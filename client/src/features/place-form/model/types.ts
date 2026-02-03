import type { LatLng } from "@/entities/geodata";
import type { EventPlace } from "@/entities/place";

export type EventPlaceForm = Omit<
  EventPlace,
  "id" | "isUsed" | "available" | "geometry" | "eventDepositSize"
> & {
  available: boolean;
  eventDepositSize: number;
  geometry: LatLng | null;
};
