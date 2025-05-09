import type { Event } from "@/entities/event";
import type { DateRange } from "react-day-picker";

import { fromUnixTime } from "date-fns";

export const extractRanges = (events: Event[], eventId?: number) =>
  events.reduce<DateRange[]>((acc, curr) => {
    if (curr.id === eventId) return acc;
    const isPending = curr.status === "submitted";
    const isApproved = curr.status === "approved";

    if (!(isPending || isApproved)) return acc;

    const daysInMs = curr.daysAmount * 60 * 60 * 24;

    acc.push({
      from: fromUnixTime(curr.startDateTimestamp),
      to: fromUnixTime(curr.startDateTimestamp + daysInMs),
    });
    return acc;
  }, []);
