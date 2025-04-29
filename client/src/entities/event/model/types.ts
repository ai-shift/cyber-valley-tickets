import type { EventPlaceModel } from "@/entities/place/@x/event";

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
