import { fromUnixTime } from "date-fns";

export function getTimeString(date: Date | number) {
  let actualDate: Date;
  if (date instanceof Date) {
    actualDate = date;
    return `${actualDate.getHours()}:${actualDate.getMinutes() >= 10 ? actualDate.getMinutes() : `0${actualDate.getMinutes()}`}`;
  }
  if (typeof date === "number") {
    actualDate = fromUnixTime(date);
    return `${actualDate.getHours()}:${actualDate.getMinutes() >= 10 ? actualDate.getMinutes() : `0${actualDate.getMinutes()}`}`;
  }
}
