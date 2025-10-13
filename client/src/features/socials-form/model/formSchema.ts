import type { Socials } from "@/entities/socials";
import { type ZodType, z } from "zod";

export const formSchema: ZodType<Socials> = z.object({
  network: z.enum(["telegram", "whatsapp", "instagram", "discord"]),
  value: z.string().min(1, "Enter contact information"),
});
