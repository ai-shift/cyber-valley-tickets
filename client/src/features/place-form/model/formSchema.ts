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
