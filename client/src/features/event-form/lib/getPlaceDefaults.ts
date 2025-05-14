import type { EventPlace } from "@/entities/place";
import { isDateAvailable } from "../model/formSchema";
import { addDays } from "date-fns";
import { extractBookedRangesForPlace } from "./extractBookedRangesForPlace";
import type { Event } from "@/entities/event";
import type { EventFormOutput } from "../model/types";

type PartialPlace = Pick<
  EventFormOutput,
  "ticketPrice" | "place" | "startDate" | "daysAmount"
>;

export const getPlaceDefaults = (
  place: EventPlace,
  events: Event[],
  excludedEventsId?: number[],
): PartialPlace => {
  const daysAmount = place.minDays;
  const daysBeforedCancel = place.daysBeforeCancel;

  const currentRanges = extractBookedRangesForPlace(
    events,
    place,
    excludedEventsId,
  );

  const getFirstAvailableDate = (): Date => {
    let initial = new Date();
    while (
      !isDateAvailable(initial, daysAmount, daysBeforedCancel, currentRanges)
    ) {
      initial = addDays(initial, 1);
    }
    return initial;
  };

  return {
    ticketPrice: place.minPrice,
    place: `${place.id}`,
    startDate: getFirstAvailableDate(),
    daysAmount,
  };
};
