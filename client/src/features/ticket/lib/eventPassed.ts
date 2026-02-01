import { getUnixTime } from "date-fns";

export const isEventPassed = (start: number, days: number) => {
  const daysToSeconds = days * 24 * 60 * 60;
  const now = getUnixTime(new Date());

  return now > start + daysToSeconds;
};
