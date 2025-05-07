import type { Socials } from "@/entities/order";
import { type ZodType, z } from "zod";

export const formSchema: ZodType<Socials> = z.object({
  type: z.enum(["telegram", "instagram", "discord", "whatsapp"]),
  contactInfo: z.string().min(1, "Enter contact information"),
});
