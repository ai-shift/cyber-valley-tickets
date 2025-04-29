import type { EventPlaceModel } from "@/entities/place/@x/event";
import type { components } from "@/shared/api";

export type Event = components["schemas"]["StaffEvent" | "CreatorEvent"];

export type EventModel = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  place: EventPlaceModel;
  ticketPrice: number;
  ticketsBought: number;
  cancelDate: number;
  startDate: number;
  durationDays: number;
};

export type EventFormModel = {
  title: string;
  description: string;
  image?: File;
  place: string;
  ticketPrice: string;
  startDate: Date;
  durationDays: string;
};
