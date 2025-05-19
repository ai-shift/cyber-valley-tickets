import type { Event } from "@/entities/event";
import type { EventPlace } from "@/entities/place";
import { addDays } from "date-fns";
import { isDateAvailable } from "../model/formSchema";
import type { EventFormOutput } from "../model/types";
import { extractBookedRangesForPlace } from "./extractBookedRangesForPlace";

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
