import type { EventPlace } from "@/entities/place";
import type { EventFormOutput } from "./types";

import type { DateRange } from "react-day-picker";
import { type ZodType, z } from "zod";

export function createFormSchema(
  places: EventPlace[],
  bookedRanges: DateRange[],
): ZodType<EventFormOutput> {
  return z
    .object({
      title: z.string().min(1, "Title is required"),
      description: z.string().min(10, "This is too short for description"),
      image: z
        .instanceof(File)
        .refine((val) => val instanceof File, {
          message: "File is required.",
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
      if (place && +data.ticketPrice < place.minPrice) {
        ctx.addIssue({
          path: ["ticketPrice"],
          message: "Ticket price should be bigger than minimum",
          code: z.ZodIssueCode.custom,
        });
      }

      if (
        !isDateAvailable(
          data.startDate,
          data.daysAmount,
          place ? place.daysBeforeCancel : 1,
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
  daysAmountStr: number | string,
  daysBeforeCancel: number,
  bookedRanges: DateRange[],
): boolean => {
  const daysAmount = Number(daysAmountStr);
  if (Number.isNaN(daysAmount)) {
    throw new Error("Days amount is NaN");
  }
  if (addDays(new Date(), daysBeforeCancel + 2) > startDate) {
    return false;
  }
  const hasOverlap = (date: Date, range: DateRange) =>
    range.from != null &&
    range.to != null &&
    date >= range.from &&
    date <= range.to;
  const endDate = addDays(startDate, daysAmount);
  return !bookedRanges.find(
    (range) => hasOverlap(startDate, range) || hasOverlap(endDate, range),
  );
};

export const addDays = (date: Date, days: number): Date =>
  new Date(date.setDate(date.getDate() + days));
