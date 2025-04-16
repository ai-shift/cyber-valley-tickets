import { timestamp } from "./helpers";
import type {
  CreateEventPlaceArgs,
  SubmitEventRequestArgs,
  UpdateEventPlaceArgs,
} from "./types";

export const devTeamPercentage = 10;
export const masterPercentage = 50;
export const eventRequestSubmitionPrice = BigInt(100);
export const defaultCreateEventPlaceRequest: CreateEventPlaceArgs = {
  maxTickets: 100,
  minTickets: 50,
  minPrice: 20,
  minDays: 1,
};

export const defaultUpdateEventPlaceRequest: UpdateEventPlaceArgs = {
  eventPlaceId: 0,
  maxTickets: 150,
  minTickets: 20,
  minPrice: 30,
  minDays: 2,
};

export const defaultSubmitEventRequest: SubmitEventRequestArgs = {
  eventPlaceId: defaultUpdateEventPlaceRequest.eventPlaceId,
  ticketPrice: defaultCreateEventPlaceRequest.minPrice,
  startDate: timestamp(5),
  cancelDate: timestamp(1),
  daysAmount: defaultCreateEventPlaceRequest.minDays,
};
