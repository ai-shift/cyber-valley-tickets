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

      const maxDays = bookedRanges.reduce<number>((acc, curr) => {
        const startDate = data.startDate;
        const endDate = curr.from;
        if (endDate === undefined) return acc;
        const diff = endDate.getTime() - startDate.getTime();
        if (diff < 0) return acc;
        const dayDiff = Math.round(diff / (24 * 60 * 60 * 1000));
        if (dayDiff < acc) return dayDiff;
        return acc;
      }, 999);

      if (+data.daysAmount > maxDays) {
        ctx.addIssue({
          path: ["daysAmount"],
          message: "Event overlaps with other event",
          code: z.ZodIssueCode.custom,
        });
      }
    });
}
