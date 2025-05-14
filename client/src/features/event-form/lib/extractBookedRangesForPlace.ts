import type { Event } from "@/entities/event";
import type { DateRange } from "react-day-picker";
import type { EventPlace } from "@/entities/place";

import { fromUnixTime } from "date-fns";
import { addDays } from "../model/formSchema";

export const extractBookedRangesForPlace = (
  events: Event[],
  place: EventPlace,
  excludedEventsId?: number[],
) => {
  const bookedRanges: DateRange[] = [];
  const placeEvents = events.filter(
    (event) =>
      event.place.id === place.id &&
      !excludedEventsId?.includes(event.id) &&
      ["submited", "approved"].includes(event.status ?? ""),
  );

  for (const event of placeEvents) {
    const from = fromUnixTime(event.startDateTimestamp);

    bookedRanges.push({
      from,
      to: addDays(from, event.daysAmount - 1),
    });
  }

  return bookedRanges;
};
