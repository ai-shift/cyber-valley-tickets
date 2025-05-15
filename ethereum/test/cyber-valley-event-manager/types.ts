import type { BigNumberish } from "ethers";
import type { CyberValleyEventManager } from "../../typechain-types";

export type EventApprovedEvent = { eventRequestId: BigNumberish };
export type EventDeclinedEvent = { eventRequestId: BigNumberish };
export type EventPlaceUpdatedEvent = {
  eventPlaceId: BigNumberish;
  maxTickets: BigNumberish;
  minTickets: BigNumberish;
  minPrice: BigNumberish;
  daysBeforeCancel: BigNumberish;
  minDays: BigNumberish;
  available: boolean;
  digest: string;
  hashFunction: BigNumberish;
  size: BigNumberish;
};
export type EventUpdatedEvent = {
  id: BigNumberish;
  eventPlaceId: BigNumberish;
  ticketPrice: BigNumberish;
  startDate: BigNumberish;
  daysAmount: BigNumberish;
  digest: string;
  hashFunction: BigNumberish;
  size: BigNumberish;
};
export type NewEventRequestEvent = {
  creator: string;
  id: BigNumberish;
  eventPlaceId: BigNumberish;
  ticketPrice: BigNumberish;
  startDate: BigNumberish;
  daysAmount: BigNumberish;
  digest: string;
  hashFunction: BigNumberish;
  size: BigNumberish;
};
export type RoleAdminChangedEvent = {
  role: string;
  previousAdminRole: string;
  newAdminRole: string;
};
export type RoleGrantedEvent = {
  role: string;
  account: string;
  sender: string;
};
export type RoleRevokedEvent = {
  role: string;
  account: string;
  sender: string;
};

// Struct types
export type Multihash = {
  digest: string;
  hashFunction: BigNumberish;
  size: BigNumberish;
};

export type EventPlace = {
  maxTickets: BigNumberish;
  minTickets: BigNumberish;
  minPrice: BigNumberish;
  daysBeforeCancel: BigNumberish;
  minDays: BigNumberish;
  meta: Multihash;
};

export type Event = {
  creator: string;
  eventPlaceId: BigNumberish;
  ticketPrice: BigNumberish;
  startDate: BigNumberish;
  daysAmount: BigNumberish;
  status: BigNumberish;
  meta: Multihash;
};

// Method argument types
export type ApproveEventArgs = {
  eventId: BigNumberish;
};

export type DeclineEventArgs = {
  eventId: BigNumberish;
};

export type CreateEventPlaceArgs = {
  maxTickets: BigNumberish;
  minTickets: BigNumberish;
  minPrice: BigNumberish;
  daysBeforeCancel: BigNumberish;
  minDays: BigNumberish;
  available: boolean;
  digest: string;
  hashFunction: BigNumberish;
  size: BigNumberish;
};

export type SubmitEventRequestArgs = {
  eventPlaceId: BigNumberish;
  ticketPrice: BigNumberish;
  startDate: BigNumberish;
  daysAmount: BigNumberish;
  digest: string;
  hashFunction: BigNumberish;
  size: BigNumberish;
};

export type UpdateEventArgs = {
  eventId: BigNumberish;
  eventPlaceId: BigNumberish;
  ticketPrice: BigNumberish;
  startDate: BigNumberish;
  daysAmount: BigNumberish;
  digest: string;
  hashFunction: BigNumberish;
  size: BigNumberish;
};

export type UpdateEventPlaceArgs = {
  eventPlaceId: BigNumberish;
  maxTickets: BigNumberish;
  minTickets: BigNumberish;
  minPrice: BigNumberish;
  daysBeforeCancel: BigNumberish;
  minDays: BigNumberish;
  available: boolean;
  digest: string;
  hashFunction: BigNumberish;
  size: BigNumberish;
};

export type CloseEventArgs = {
  eventId: BigNumberish;
};

export type CancelEventArgs = {
  eventId: BigNumberish;
};

// Conversion functions

export const approveEventArgsToArray = (
  args: ApproveEventArgs,
): Parameters<CyberValleyEventManager["approveEvent"]> => {
  return [args.eventId];
};

export const declineEventArgsToArray = (
  args: DeclineEventArgs,
): Parameters<CyberValleyEventManager["declineEvent"]> => {
  return [args.eventId];
};

export const createEventPlaceArgsToArray = (
  args: CreateEventPlaceArgs,
): Parameters<CyberValleyEventManager["createEventPlace"]> => {
  return [
    args.maxTickets,
    args.minTickets,
    args.minPrice,
    args.daysBeforeCancel,
    args.minDays,
    args.available,
    args.digest,
    args.hashFunction,
    args.size,
  ];
};

export const submitEventRequestArgsToArray = (
  args: SubmitEventRequestArgs,
): Parameters<CyberValleyEventManager["submitEventRequest"]> => {
  return [
    args.eventPlaceId,
    args.ticketPrice,
    args.startDate,
    args.daysAmount,
    args.digest,
    args.hashFunction,
    args.size,
  ];
};

export const updateEventArgsToArray = (
  args: UpdateEventArgs,
): Parameters<CyberValleyEventManager["updateEvent"]> => {
  return [
    args.eventId,
    args.eventPlaceId,
    args.ticketPrice,
    args.startDate,
    args.daysAmount,
    args.digest,
    args.hashFunction,
    args.size,
  ];
};

export const updateEventPlaceArgsToArray = (
  args: UpdateEventPlaceArgs,
): Parameters<CyberValleyEventManager["updateEventPlace"]> => {
  return [
    args.eventPlaceId,
    args.maxTickets,
    args.minTickets,
    args.minPrice,
    args.daysBeforeCancel,
    args.minDays,
    args.available,
    args.digest,
    args.hashFunction,
    args.size,
  ];
};

export const closeEventArgsToArray = (
  args: CloseEventArgs,
): Parameters<CyberValleyEventManager["closeEvent"]> => {
  return [args.eventId];
};

export const cancelEventArgsToArray = (
  args: CancelEventArgs,
): Parameters<CyberValleyEventManager["cancelEvent"]> => {
  return [args.eventId];
};
