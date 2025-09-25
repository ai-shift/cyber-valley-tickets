/**
 * Get the user's local timezone offset from UTC in hours
 * @returns A string representation of the timezone offset (e.g., "+3", "-5", "+0")
 */
export const getTimezoneOffset = (): string => {
  const offsetMinutes = new Date().getTimezoneOffset();
  const offsetHours = -offsetMinutes / 60; // Negative because getTimezoneOffset returns negative for ahead of UTC

  if (offsetHours >= 0) {
    return `+${offsetHours}`;
  }
  return offsetHours.toString();
};
