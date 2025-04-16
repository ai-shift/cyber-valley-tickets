import type { BigNumberish, ContractTransactionResponse } from "ethers";
import type { CyberValleyEventManager } from "../../typechain-types";

// I'm going crazy with such an idiotic way of getting struct type
type Numbers = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15";
export type Event = Omit<Awaited<ReturnType<CyberValleyEventManager["events"]>>, Numbers | keyof any[]>;

export type SubmitEventRequest = Omit<Event, "status" | "creator"}>;

export type CreateEventPlaceRequest = {
  maxTickets: BigNumberish;
  minTickets: BigNumberish;
  minPrice: BigNumberish;
  minDays: BigNumberish;
};

export type UpdateEventPlaceRequest = {
  eventPlaceId: BigNumberish;
  maxTickets: BigNumberish;
  minTickets: BigNumberish;
  minPrice: BigNumberish;
  minDays: BigNumberish;
};

export type EventPlaceCreated = {
  tx: ContractTransactionResponse;
  eventPlaceId: number;
};

export type EventRequest = {
  id: BigNumberish;
  eventPlaceId: BigNumberish;
  ticketPrice: BigNumberish;
  startDate: BigNumberish;
  cancelDate: BigNumberish;
  daysAmount: BigNumberish;
};

export type ApproveEventRequest = {
  eventId: BigNumberish;
};
