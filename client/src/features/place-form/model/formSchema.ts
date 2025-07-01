import { type ZodType, z } from "zod";
import type { EventPlaceForm } from "./types";

const numberField = (min: number, max: number, fieldName: string) =>
  z
    .number({
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be a number`,
    })
    .refine((val) => !Number.isNaN(val), "Not a valid number")
    .refine((val) => val <= max, `${fieldName} is too big`)
    .refine((val) => val >= min, `${fieldName} is too small`);

export const formSchema: ZodType<EventPlaceForm> = z
  .object({
    title: z.string().min(1, "Title is required"),
    locationUrl: z
      .string()
      .min(1, "Link to the place loction required")
      .url("Link should be a valid URL"),
    maxTickets: numberField(1, 65536, "Maximum ticket amount"),
    minTickets: numberField(1, 65536, "Minimum ticket amount"),
    minPrice: numberField(1, 65536, "Minimum price"),
    minDays: numberField(1, 256, "Minimum days limit"),
    daysBeforeCancel: numberField(1, 65536, "Period before cancellation"),
    available: z.boolean(),
  })
  .refine(({ maxTickets, minTickets }) => maxTickets > minTickets, {
    message: "Minimum tickets amount can't be bigger then maximum",
    path: ["maxTickets"],
  })
  .refine(({ maxTickets, minTickets }) => maxTickets > minTickets, {
    message: "Minimum tickets amount can't be bigger then maximum",
    path: ["minTickets"],
  });
