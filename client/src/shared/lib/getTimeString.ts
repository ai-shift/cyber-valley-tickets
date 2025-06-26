export function getTimeString(date: Date) {
  return `${date.getHours()}:${date.getMinutes() >= 10 ? date.getMinutes() : `0${date.getMinutes()}`}`;
}
