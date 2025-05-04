import type { Socials } from "@/entities/order";
import { z, type ZodType } from "zod";

export const formSchema: ZodType<Socials> = z.object({
  type: z.string().min(1, "Select one of the possible metworks"),
  contactInfo: z.string().min(1, "Enter contact information"),
});
