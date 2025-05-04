import { z } from "zod";

// TODO: Check for the address length (42)
export const formSchema = z.object({
  address: z
    .string()
    .nonempty("Address is required")
    .refine((val) => val.startsWith("0x"), {
      message: "Address must start with '0x'",
    }),
});
