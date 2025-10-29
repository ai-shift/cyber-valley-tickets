import type { Socials } from "@/entities/user";
import { type ZodType, z } from "zod";

export const formSchema = z
  .object({
    network: z.enum(["telegram", "whatsapp", "instagram", "discord"]),
    value: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.network === "telegram") {
        return true;
      }
      return data.value && data.value.length > 0;
    },
    {
      message: "Enter contact information",
      path: ["value"],
    }
  );
