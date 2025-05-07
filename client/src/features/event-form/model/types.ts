type EventFormType = {
  title: string;
  description: string;
  place: string;
  ticketPrice: number;
  startDate: Date;
  daysAmount: number;
};

export type EventFormInput = EventFormType & { image?: File };
export type EventFormOutput = EventFormType & { image: File };
