import { type ZodType, z } from "zod";
import type { EventPlaceForm } from "./types";

const numberField = (
  min: number,
  max: number,
  fieldName: string,
  allowZero = false,
) =>
  z
    .number({
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be a number`,
    })
    .refine((val) => !Number.isNaN(val), "Not a valid number")
    .refine((val) => val <= max, `${fieldName} is too big`)
    .refine((val) => val >= min, `${fieldName} is too small`)
    .refine(
      (val) => (allowZero ? val >= 0 : val >= 1),
      `${fieldName} ${allowZero ? "can't be negative" : "is too small"}`,
    );

export const formSchema: ZodType<EventPlaceForm> = z
  .object({
    title: z.string().min(1, "Title is required"),
    maxTickets: numberField(1, 100000, "Maximum ticket amount"),
    minTickets: numberField(1, 100000, "Minimum ticket amount"),
    minPrice: numberField(0, 100000, "Minimum price", true),
    minDays: numberField(0, 100000, "Minimum days limit", true),
    daysBeforeCancel: numberField(
      0,
      100000,
      "Period before cancellation",
      true,
    ),
  })
  .refine(({ maxTickets, minTickets }) => maxTickets > minTickets, {
    message: "Minimum tickets amount can't be bigger then maximum",
    path: ["maxTickets"],
  })
  .refine(({ maxTickets, minTickets }) => maxTickets > minTickets, {
    message: "Minimum tickets amount can't be bigger then maximum",
    path: ["minTickets"],
  });
