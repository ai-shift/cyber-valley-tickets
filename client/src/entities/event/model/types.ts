import type { components } from "@/shared/api";

export type Event = components["schemas"]["StaffEvent" | "CreatorEvent"];
export type EventDto = Pick<
  Event,
  "title" | "description" | "daysAmount" | "ticketPrice"
> & {
  image: File;
  startTimeTimeStamp: number;
  place: string;
};
