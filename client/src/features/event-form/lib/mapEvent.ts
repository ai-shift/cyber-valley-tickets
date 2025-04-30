import type { Event } from "@/entities/event/";
import type { EventForm } from "../model/types";

export function mapEventToEventForm(event: Event): EventForm {
  return {
    title: event.title,
    description: event.description,
    image: undefined,
    place: event.place.id.toString(),
    ticketPrice: event.ticketPrice,
    startDate: new Date(event.startDateTimestamp),
    daysAmount: event.daysAmount,
  };
}
