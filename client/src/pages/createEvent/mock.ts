import type { EventPlaceModel } from "@/entities/place/@x/event";

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

export const mockEventPlaces: EventPlaceModel[] = [
  {
    id: "place-1",
    title: "Espoo Metro Areena",
    maxTickets: 5000,
    minTickets: 100,
    minPrice: 15,
    minDays: 1,
    available: true,
  },
  {
    id: "place-2",
    title: "Helsinki Exhibition and Convention Centre",
    maxTickets: 10000,
    minTickets: 500,
    minPrice: 25,
    minDays: 2,
    available: true,
  },
  {
    id: "place-3",
    title: "Tampere Hall",
    maxTickets: 2000,
    minTickets: 50,
    minPrice: 20,
    minDays: 1,
    available: true,
  },
  {
    id: "place-4",
    title: "Turku Castle Courtyard",
    maxTickets: 1500,
    minTickets: 20,
    minPrice: 10,
    minDays: 1,
    available: true,
  },
  {
    id: "place-5",
    title: "Oulu Music Centre",
    maxTickets: 800,
    minTickets: 30,
    minPrice: 18,
    minDays: 1,
    available: true,
  },
  {
    id: "place-6",
    title: "Savonlinna Opera Festival Stage",
    maxTickets: 1200,
    minTickets: 1,
    minPrice: 40,
    minDays: 3,
    available: true,
  },
  {
    id: "place-7",
    title: "Rovaniemi Culture House Korundi",
    maxTickets: 500,
    minTickets: 10,
    minPrice: 12,
    minDays: 1,
    available: true,
  },
  {
    id: "place-8",
    title: "Lahti Sibelius Hall",
    maxTickets: 1800,
    minTickets: 75,
    minPrice: 22,
    minDays: 1,
    available: true,
  },
  {
    id: "place-9",
    title: "Jyväskylä Paviljonki",
    maxTickets: 3000,
    minTickets: 150,
    minPrice: 16,
    minDays: 2,
    available: true,
  },
  {
    id: "place-10",
    title: "Porvoo Art Hall",
    maxTickets: 300,
    minTickets: 5,
    minPrice: 8,
    minDays: 1,
    available: true,
  },
];
