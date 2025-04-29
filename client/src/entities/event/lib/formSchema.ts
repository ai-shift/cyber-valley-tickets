import type { EventPlaceModel } from "@/entities/place";
import type { EventFormModel } from "../model/types";

import { z, type ZodType } from "zod";
import type { DateRange } from "react-day-picker";

export function createFormSchema(
  places: EventPlaceModel[],
  bookedRanges: DateRange[],
): ZodType<EventFormModel> {
  return z
    .object({
      title: z.string().min(1, "Title is required"),
      description: z.string().min(10, "This is too short for description"),
      image: z
        .instanceof(File)
        .optional()
        .refine((val) => val instanceof File, {
          message: "File is required.",
        })
        .refine((val) => val?.size <= 10 * 1024 * 1024, {
          message: "File size must be less than 10MB.",
        })
        .refine(
          (val) =>
            ["image/jpeg", "image/png", "application/pdf"].includes(val?.type),
          {
            message: "Only .jpg, .png, and .pdf files are allowed.",
          },
        ),
      place: z.string().min(1, "Place is required"),
      ticketPrice: z
        .string()
        .transform(Number)
        .refine((val) => !Number.isNaN(val), "Not a valid number")
        .refine((val) => val >= 1, "Price is too small")
        .transform((val) => val.toString()),
      startDate: z.date(),
      durationDays: z
        .string()
        .transform(Number)
        .refine((val) => !Number.isNaN(val), "Not a valid number")
        .refine((val) => val >= 1, "Duration must be at least 1 day")
        .transform((val) => val.toString()),
    })
    .superRefine((data, ctx) => {
      const place = places.find((p) => p.id === data.place);
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

      if (+data.durationDays > maxDays) {
        ctx.addIssue({
          path: ["durationDays"],
          message: "Event overlaps with other event",
          code: z.ZodIssueCode.custom,
        });
      }
    });
}
