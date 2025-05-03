import type { Event } from "@/entities/event";
import type { DateRange } from "react-day-picker";

import { fromUnixTime } from "date-fns";

export const extractRanges = (events: Event[]) =>
  events.reduce<DateRange[]>((acc, curr) => {
    const isPending = curr.status === "submitted";
    const isApproved = curr.status === "approved";

    if (!(isPending || isApproved)) return acc;

    const daysInMs = curr.daysAmount * 1000 * 60 * 60 * 24;

    acc.push({
      from: fromUnixTime(curr.startDateTimestamp / 1000),
      to: fromUnixTime((curr.startDateTimestamp + daysInMs) / 1000),
    });
    return acc;
  }, []);
