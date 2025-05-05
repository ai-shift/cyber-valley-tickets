import type { Socials } from "@/entities/order";
import { type ZodType, z } from "zod";

export const formSchema: ZodType<Socials> = z.object({
  // TODO: Fix typo
  type: z.string().min(1, "Select one of the possible metworks"),
  contactInfo: z.string().min(1, "Enter contact information"),
});
