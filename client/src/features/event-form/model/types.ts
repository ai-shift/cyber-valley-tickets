type EventFormType = {
  title: string;
  description: string;
  website: string | undefined;
  place: string;
  ticketPrice: number;
  startDate: Date;
  daysAmount: number;
  categories: CategoryDraft[];
};

export type CategoryDraft = {
  id: string;
  name: string;
  discount: number;
  quota: number;
};

export type EventFormInput = EventFormType & { image?: File };
export type EventFormOutput = EventFormType & { image: File };
