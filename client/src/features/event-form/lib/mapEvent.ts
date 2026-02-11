import type { Event, EventDto } from "@/entities/event/";
import { formatUsdt, parseUsdt } from "@/shared/lib/money/usdt";
import { getUnixTime } from "date-fns";
import type { EventFormInput, EventFormOutput } from "../model/types";

export function mapEventToEventForm(
  event: Event,
  categories: EventFormInput["categories"] = [],
): EventFormInput {
  return {
    title: event.title,
    description: event.description,
    website: event.website || undefined,
    image: undefined,
    place: event.place.id.toString(),
    ticketPrice: formatUsdt(BigInt(event.ticketPrice)),
    startDate: new Date(event.startDateTimestamp),
    daysAmount: event.daysAmount,
    categories,
  };
}

export function mapEventFormToEventDto(eventForm: EventFormOutput): EventDto {
  return {
    title: eventForm.title,
    description: eventForm.description,
    website: eventForm.website,
    image: eventForm.image,
    place: eventForm.place,
    daysAmount: eventForm.daysAmount,
    startTimeTimeStamp: getUnixTime(eventForm.startDate),
    // Contract/API expect micro-units (USDT 6 decimals) as a string.
    ticketPrice: parseUsdt(eventForm.ticketPrice).toString(),
    categories: eventForm.categories,
  };
}
