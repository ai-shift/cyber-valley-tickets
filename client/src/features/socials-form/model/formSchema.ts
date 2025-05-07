import type { Socials } from "@/entities/order";
import { type ZodType, z } from "zod";

export const formSchema: ZodType<Socials> = z.object({
  type: z.string().min(1, "Pick one of social networks"),
  contactInfo: z.string().min(1, "Enter contact information"),
});
