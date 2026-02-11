import { parseUsdt } from "@/shared/lib/money/usdt";
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
    geometry: z
      .object({
        lat: z
          .number()
          .min(-90, "Latitiude can't be less then -90")
          .max(90, "Latitude can't be greater then 90"),
        lng: z
          .number()
          .min(-180, "Longitude can't be less then -90")
          .max(180, "Longitude can't be greater then 90"),
      })
      .nullable()
      .refine((val) => val != null, "Event place should have a location"),
    maxTickets: numberField(1, 65536, "Maximum ticket amount"),
    minTickets: numberField(1, 65536, "Minimum ticket amount"),
    minPrice: z.string().min(1, "Minimum price is required"),
    minDays: numberField(1, 256, "Minimum days limit"),
    daysBeforeCancel: numberField(1, 65536, "Period before cancellation"),
    eventDepositSize: z.string().min(1, "Event deposit is required"),
    available: z.boolean(),
  })
  .superRefine((data, ctx) => {
    try {
      const minPrice = parseUsdt(data.minPrice);
      if (minPrice <= 0n) {
        ctx.addIssue({
          path: ["minPrice"],
          message: "Minimum price must be greater than 0",
          code: z.ZodIssueCode.custom,
        });
      }
    } catch {
      ctx.addIssue({
        path: ["minPrice"],
        message: "Minimum price must be a valid USDT amount (up to 6 decimals)",
        code: z.ZodIssueCode.custom,
      });
    }

    try {
      const dep = parseUsdt(data.eventDepositSize);
      if (dep <= 0n) {
        ctx.addIssue({
          path: ["eventDepositSize"],
          message: "Event deposit must be greater than 0",
          code: z.ZodIssueCode.custom,
        });
      }
    } catch {
      ctx.addIssue({
        path: ["eventDepositSize"],
        message: "Event deposit must be a valid USDT amount (up to 6 decimals)",
        code: z.ZodIssueCode.custom,
      });
    }
  })
  .refine(({ maxTickets, minTickets }) => maxTickets > minTickets, {
    message: "Minimum tickets amount can't be bigger then maximum",
    path: ["maxTickets"],
  })
  .refine(({ maxTickets, minTickets }) => maxTickets > minTickets, {
    message: "Minimum tickets amount can't be bigger then maximum",
    path: ["minTickets"],
  });
