import type { EventPlace } from "@/entities/place";

export type DateRange = {
  from: Date | undefined;
  to?: Date | undefined;
};

export const mockDateRanges: DateRange[] = [
  // May 2025 (Non-overlapping)
  { from: new Date("2025-05-01"), to: new Date("2025-05-05") },
  { from: new Date("2025-05-08"), to: new Date("2025-05-12") },
  { from: new Date("2025-05-15"), to: new Date("2025-05-20") },
  { from: new Date("2025-05-23"), to: new Date("2025-05-28") },

  // June 2025 (Non-overlapping)
  { from: new Date("2025-06-02"), to: new Date("2025-06-07") },
  { from: new Date("2025-06-10"), to: new Date("2025-06-14") },
  { from: new Date("2025-06-17"), to: new Date("2025-06-21") },
  { from: new Date("2025-06-24"), to: new Date("2025-06-28") },
  { from: new Date("2025-06-01"), to: new Date("2025-06-01") }, // Single day range
];

export const mockEventPlaces: EventPlace[] = [
  {
    id: 1,
    title: "Tech Conference 2025",
    maxTickets: 500,
    minTickets: 1,
    minPrice: 50,
    minDays: 2,
    daysBeforeCancel: 7,
    available: true,
    isUsed: false,
  },
  {
    id: 2,
    title: "Summer Music Festival",
    maxTickets: 2000,
    minTickets: 3,
    minPrice: 25,
    minDays: 1,
    daysBeforeCancel: 3,
    available: true,
    isUsed: false,
  },
  {
    id: 3,
    title: "Art Exhibition Opening",
    maxTickets: 150,
    minTickets: 1,
    minPrice: 0,
    minDays: 0,
    daysBeforeCancel: 1,
    available: true,
    isUsed: true,
  },
  {
    id: 4,
    title: "Culinary Workshop",
    maxTickets: 50,
    minTickets: 2,
    minPrice: 75,
    minDays: 1,
    daysBeforeCancel: 5,
    available: false,
    isUsed: false,
  },
  {
    id: 5,
    title: "Outdoor Adventure Trip",
    maxTickets: 30,
    minTickets: 4,
    minPrice: 120,
    minDays: 3,
    daysBeforeCancel: 10,
    available: true,
    isUsed: false,
  },
  {
    id: 6,
    title: "Book Club Meeting",
    maxTickets: 20,
    minTickets: 1,
    minPrice: 0,
    minDays: 0,
    daysBeforeCancel: 0,
    available: true,
    isUsed: true,
  },
  {
    id: 7,
    title: "Photography Masterclass",
    maxTickets: 40,
    minTickets: 1,
    minPrice: 90,
    minDays: 2,
    daysBeforeCancel: 6,
    available: true,
    isUsed: false,
  },
  {
    id: 8,
    title: "Charity Gala Dinner",
    maxTickets: 100,
    minTickets: 2,
    minPrice: 150,
    minDays: 1,
    daysBeforeCancel: 4,
    available: true,
    isUsed: false,
  },
  {
    id: 9,
    title: "Kids Coding Camp",
    maxTickets: 60,
    minTickets: 1,
    minPrice: 60,
    minDays: 5,
    daysBeforeCancel: 12,
    available: true,
    isUsed: false,
  },
  {
    id: 10,
    title: "Yoga and Wellness Retreat",
    maxTickets: 25,
    minTickets: 1,
    minPrice: 180,
    minDays: 2,
    daysBeforeCancel: 8,
    available: true,
    isUsed: false,
  },
];
