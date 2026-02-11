import type { LatLng } from "@/entities/geodata";

export type EventPlaceForm = {
  title: string;
  geometry: LatLng | null;
  maxTickets: number;
  minTickets: number;
  minPrice: string;
  minDays: number;
  daysBeforeCancel: number;
  eventDepositSize: string;
  available: boolean;
};
