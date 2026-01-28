import { Event } from "@/entities/event"
import { EventPlace } from "@/entities/place";

export interface PlaceWithEvents extends EventPlace  {
  events: Omit<Event, "place">[];
}
