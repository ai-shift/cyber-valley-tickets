import { z } from "zod";

export const formSchema = z.object({
  address: z
    .string()
    .length(42, "Address should be 42 symbols long")
    .nonempty("Address is required")
    .refine((val) => val.startsWith("0x"), {
      message: "Address must start with '0x'",
    }),
  share: z
    .number()
    .int()
    .min(0, "Share have to be a whole number from 0 to 100")
    .max(100, "Share have to be a whole number from 0 to 100"),
});
