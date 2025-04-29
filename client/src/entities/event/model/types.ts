import type { components } from "@/shared/api";

export type Event = components["schemas"]["StaffEvent" | "CreatorEvent"];

export type EventForm = {
  title: string;
  description: string;
  image?: File;
  place: string;
  ticketPrice: string;
  startDate: Date;
  daysAmount: string;
};
