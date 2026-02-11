import { fromUnixTime } from "date-fns";

type TimeStringOptions = {
  utc?: boolean;
};

export function getTimeString(
  date: Date | number,
  options?: TimeStringOptions,
): string {
  const actualDate = date instanceof Date ? date : fromUnixTime(date);
  const useUtc = options?.utc === true;
  const hours = useUtc ? actualDate.getUTCHours() : actualDate.getHours();
  const minutes = useUtc ? actualDate.getUTCMinutes() : actualDate.getMinutes();
  const minutesString = minutes >= 10 ? `${minutes}` : `0${minutes}`;
  return `${hours}:${minutesString}`;
}
