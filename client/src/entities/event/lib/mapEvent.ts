import type { EventForm, Event } from "../model/types";

export function mapEventToEventForm(event: Event): EventForm {
  return {
    title: event.title,
    description: event.description,
    image: undefined,
    place: event.place.id.toString(),
    ticketPrice: event.ticketPrice.toString(),
    startDate: new Date(event.startDate),
    daysAmount: event.daysAmount.toString(),
  };
}
