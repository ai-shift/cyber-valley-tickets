export const pluralDays = (days: number) => `day${days > 1 ? "s" : ""}`;

export const pluralTickets = (count: number) =>
  `${count} ticket${count === 1 ? "" : "s"}`;
