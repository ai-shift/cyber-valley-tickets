import type { Event } from "@/entities/event";

export type EventSortFunction = (events: Event[]) => Event[];
