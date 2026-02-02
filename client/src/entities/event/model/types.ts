import type { CategoryDraft } from "@/features/event-form";
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
  categories: CategoryDraft[];
};

export type EventDtoWithId = EventDto & {
  id: number;
};

// Category input for smart contract
export interface CategoryInput {
  name: string;
  discountPercentage: number;
  quota: number;
  hasQuota: boolean;
}
