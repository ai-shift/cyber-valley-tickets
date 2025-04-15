import { timestamp } from "./helpers";
import type {
  CreateEventPlaceRequest,
  EventRequest,
  UpdateEventPlaceRequest,
} from "./types";

export const devTeamPercentage = 10;
export const masterPercentage = 50;
export const eventRequestSubmitionPrice = BigInt(100);
export const defaultCreateEventPlaceRequest: CreateEventPlaceRequest = {
  maxTickets: 100,
  minTickets: 50,
  minPrice: 20,
  minDays: 1,
};

export const defaultUpdateEventPlaceRequest: UpdateEventPlaceRequest = {
  eventPlaceId: 0,
  maxTickets: 150,
  minTickets: 20,
  minPrice: 30,
  minDays: 2,
};

export const defaultSubmitEventRequest: EventRequest = {
  id: Math.floor(Math.random() * 10e6),
  eventPlaceId: defaultUpdateEventPlaceRequest.eventPlaceId,
  ticketPrice: defaultCreateEventPlaceRequest.minPrice,
  startDate: timestamp(5),
  cancelDate: timestamp(1),
  daysAmount: defaultCreateEventPlaceRequest.minDays,
};
