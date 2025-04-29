import type { EventFormModel, EventModel } from "../model/types";

export function mapEventToEventForm(event: EventModel): EventFormModel {
  return {
    title: event.title,
    description: event.description,
    image: undefined,
    place: event.place.id,
    ticketPrice: event.ticketPrice.toString(),
    startDate: new Date(event.startDate),
    durationDays: event.durationDays.toString(),
  };
}
