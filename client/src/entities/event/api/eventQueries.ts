import { queryOptions } from "@tanstack/react-query";
import {
  getDetailEvent,
  getEventAttendees,
  getEventCategories,
  getEvents,
  getTotalRevenue,
} from "./queries";

export const eventQueries = {
  list: (search?: string) =>
    queryOptions({
      queryKey: ["events", "lists", search || ""],
      queryFn: () => getEvents(search),
      select: (queryData) => queryData?.data,
      refetchInterval: 3000,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: ["events", "lists", id],
      queryFn: () => getDetailEvent(id),
      select: (queryData) => queryData?.data,
      refetchInterval: 3000,
    }),
  totalRevenue: () =>
    queryOptions({
      queryKey: ["events", "total_revenue"],
      queryFn: getTotalRevenue,
      select: (queryData) => queryData?.data,
      refetchInterval: 5000,
    }),
  attendees: (eventId: number, search?: string) =>
    queryOptions({
      queryKey: ["events", eventId, "attendees", search || ""],
      queryFn: () => getEventAttendees(eventId, search),
      select: (queryData) => queryData?.data,
      refetchInterval: 3000,
    }),
  categories: (eventId: number) =>
    queryOptions({
      queryKey: ["events", eventId, "categories"],
      queryFn: () => getEventCategories(eventId),
      select: (queryData) => queryData?.data,
      refetchInterval: 3000,
    }),
};
