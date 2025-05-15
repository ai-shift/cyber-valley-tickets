import type { EventPlace } from "@/entities/place";
import type { EventFormOutput } from "./types";
import type { DateRange } from "react-day-picker";
import type { Event } from "@/entities/event";
import { type ZodType, z } from "zod";
import { extractBookedRangesForPlace } from "../lib/extractBookedRangesForPlace";

export function createFormSchema(
  places: EventPlace[],
  events: Event[],
): ZodType<EventFormOutput> {
  return z
    .object({
      title: z.string().min(1, "Title is required"),
      description: z.string().min(10, "This is too short for description"),
      image: z
        .instanceof(File, { message: "Event must have an image" })
        .refine((val) => val instanceof File, {
          message: "Event must have an image",
        })
        .refine((val) => val.size <= 10 * 1024 * 1024, {
          message: "File size must be less than 10MB.",
        })
        .refine((val) => ["image/jpeg", "image/png"].includes(val?.type), {
          message: "Only .jpg and .png files are allowed.",
        }),
      place: z.string().min(1, "Place is required"),
      ticketPrice: z.number().refine((val) => val >= 1, "Price is too small"),
      startDate: z.date().min(new Date(), "Can't change the past"),
      daysAmount: z
        .number()
        .refine((val) => val >= 1, "Duration must be at least 1 day"),
    })
    .superRefine((data, ctx) => {
      const place = places.find((p) => `${p.id}` === data.place);
      if (place == null) {
        throw new Error(`Place was not found for ${data.place}`);
      }
      if (+data.ticketPrice < place.minPrice) {
        ctx.addIssue({
          path: ["ticketPrice"],
          message: "Ticket price should be bigger than minimum",
          code: z.ZodIssueCode.custom,
        });
      }

      const bookedRanges = extractBookedRangesForPlace(events, place);

      console.log(bookedRanges);

      if (data.daysAmount < place.minDays) {
        ctx.addIssue({
          path: ["daysAmount"],
          message: "Event length can't be less then minimal",
          code: z.ZodIssueCode.custom,
        });
      }

      if (
        !isDateAvailable(
          data.startDate,
          data.daysAmount,
          place.daysBeforeCancel,
          bookedRanges,
        )
      ) {
        ctx.addIssue({
          path: ["daysAmount"],
          message: "Event overlaps with other event",
          code: z.ZodIssueCode.custom,
        });
      }
    });
}

export const isDateAvailable = (
  startDate: Date,
  daysAmount: number,
  daysBeforeCancel: number,
  bookedRanges: DateRange[],
): boolean => {
  if (
    setToMidday(addDays(new Date(), daysBeforeCancel + 1)) >
    setToMidday(startDate)
  ) {
    return false;
  }
  const hasOverlap = (date: Date, range: DateRange) =>
    range.from != null &&
    range.to != null &&
    setToMidday(date) >= setToMidday(range.from) &&
    setToMidday(date) <= setToMidday(range.to);

  return !bookedRanges.find((range) => {
    for (let i = 0; i < daysAmount; i++) {
      if (hasOverlap(addDays(startDate, i), range)) return true;
    }
  });
};

export const addDays = (date: Date, days: number): Date => {
  const copyDate = new Date(date);
  return new Date(copyDate.setDate(date.getDate() + days));
};

export const setToMidday = (date: Date): Date => {
  return new Date(date.setHours(12, 0, 0, 0));
};
