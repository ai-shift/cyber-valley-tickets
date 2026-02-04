import type {
  CancelEventArgs,
  CategoryInput,
  CloseEventArgs,
  CreateEventPlaceArgs,
  SubmitEventRequestArgs,
  UpdateEventPlaceArgs,
} from "./types";

const multihash = {
  digest: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  hashFunction: 18,
  size: 32,
};

export const eventRequestSubmitionPrice = BigInt(100);
export const defaultCreateEventPlaceRequest: CreateEventPlaceArgs = {
  maxTickets: 100,
  minTickets: 50,
  minPrice: 20,
  daysBeforeCancel: 1,
  minDays: 1,
  available: true,
  eventDepositSize: 100,
  ...multihash,
};

export const defaultUpdateEventPlaceRequest: UpdateEventPlaceArgs = {
  eventPlaceId: 0,
  maxTickets: 150,
  minTickets: 20,
  minPrice: 30,
  daysBeforeCancel: 1,
  minDays: 2,
  available: true,
  eventDepositSize: 100,
  ...multihash,
};

export const defaultCategoryInput: CategoryInput = {
  name: "General",
  discountPercentage: 0,
  quota: 0,
  hasQuota: false,
};

export const defaultSubmitEventRequest: SubmitEventRequestArgs = {
  eventPlaceId: defaultUpdateEventPlaceRequest.eventPlaceId,
  ticketPrice: defaultCreateEventPlaceRequest.minPrice,
  startDate: 0,
  daysAmount: defaultCreateEventPlaceRequest.minDays,
  ...multihash,
  categories: [defaultCategoryInput],
};

export const defaultCloseEventArgs: CloseEventArgs = {
  eventId: 0,
};

export const defaultCancelEventArgs: CancelEventArgs = {
  eventId: 0,
};
