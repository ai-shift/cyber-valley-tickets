export const eventPassed = (start: number, days: number) => {
  const daysToMs = days * 1000 * 60 * 60 * 24;
  const now = new Date().getMilliseconds();

  return now > start + daysToMs;
};
