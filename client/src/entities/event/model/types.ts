import type { components } from "@/shared/api";

export type Event = components["schemas"]["StaffEvent" | "CreatorEvent"];
export type EventStatus = Event["status"];
// XXX: Post mortem review
export type EventDto = Pick<
  Event,
  "title" | "description" | "daysAmount" | "ticketPrice" | "website"
> & {
  image: File;
  startTimeTimeStamp: number;
  place: string;
};

export type EventDtoWithId = EventDto & {
  id: number;
};
