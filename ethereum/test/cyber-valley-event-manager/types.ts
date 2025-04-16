import type { BigNumberish, ContractTransactionResponse } from "ethers";

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
  id: BigNumberish;
};
