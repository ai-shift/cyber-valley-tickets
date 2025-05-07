import type { Event, EventDto } from "@/entities/event/";
import { getUnixTime } from "date-fns";
import type { EventFormInput, EventFormOutput } from "../model/types";

export function mapEventToEventForm(event: Event): EventFormInput {
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

export function mapEventFormToEventDto(eventForm: EventFormOutput): EventDto {
  return {
    title: eventForm.title,
    description: eventForm.description,
    image: eventForm.image,
    place: eventForm.place,
    daysAmount: eventForm.daysAmount,
    startTimeTimeStamp: getUnixTime(eventForm.startDate),
    ticketPrice: eventForm.ticketPrice,
  };
}
