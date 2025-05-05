import { z } from "zod";

export const formSchema = z.object({
  address: z
    .string()
    .length(42, "Address should be 42 symbols long")
    .nonempty("Address is required")
    .refine((val) => val.startsWith("0x"), {
      message: "Address must start with '0x'",
    }),
});
