export type EventForm = {
  title: string;
  description: string;
  image?: File;
  place: string;
  ticketPrice: number;
  startDate: Date;
  daysAmount: number;
};
