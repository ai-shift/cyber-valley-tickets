import { timestamp } from "./helpers";
export const createEventPlaceCornerCases = [
  {
    patch: {
      minTickets: 0,
    },
    revertedWith: "Values must be greater than zero",
  },
  {
    patch: {
      minTickets: 0,
      maxTickets: 0,
    },
    revertedWith: "Values must be greater than zero",
  },
  {
    patch: {
      minTickets: 5,
      maxTickets: 0,
    },
    revertedWith: "Max tickets must be greater or equal min tickets",
  },
  {
    patch: {
      minPrice: 0,
    },
    revertedWith: "Values must be greater than zero",
  },
  {
    patch: {
      minDays: 0,
    },
    revertedWith: "Values must be greater than zero",
  },
];

export const submitEventIncompatibleEventPlaceCornerCases = [
  {
    eventPlacePatch: {
      minPrice: 30,
    },
    eventRequestPatch: {
      ticketPrice: 20,
    },
    revertsWith: "Ticket price is less than allowed",
  },
  {
    eventPlacePatch: {
      minDays: 2,
    },
    eventRequestPatch: {
      daysAmount: 1,
    },
    revertsWith: "Days amount is less than allowed",
  },
  {
    eventPlacePatch: {},
    eventRequestPatch: {
      startDate: timestamp(300),
    },
    revertsWith: "Requested event is too far in the future",
  },
  {
    eventPlacePatch: {
      daysBeforeCancel: 5,
    },
    eventRequestPatch: {
      startDate: timestamp(1),
    },
    revertsWith: "Not enough time to avoid cancelling",
  },
  {
    eventPlacePatch: {
      daysBeforeCancel: 1,
    },
    eventRequestPatch: {
      startDate: timestamp(2),
    },
  }
];

export const submitEventDateRangeOverlapCornerCases = [
  {
    approvedEventPatch: {
      startDate: timestamp(5),
      daysAmount: 4,
    },
    submittedEventPatch: {
      startdate: timestamp(5),
      daysAmount: 4,
    },
  },
  {
    approvedEventPatch: {
      startDate: timestamp(5),
      daysAmount: 4,
    },
    submittedEventPatch: {
      startdate: timestamp(9),
      daysAmount: 4,
    },
  },
  {
    approvedEventPatch: {
      startDate: timestamp(5),
      daysAmount: 4,
    },
    submittedEventPatch: {
      startdate: timestamp(1),
      daysAmount: 4,
    },
  },
];
