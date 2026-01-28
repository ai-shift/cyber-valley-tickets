import type { Event } from "@/entities/event";
import type { EventPlace } from "@/entities/place";

export interface PlaceWithEvents extends EventPlace {
  events: Omit<Event, "place">[];
}
