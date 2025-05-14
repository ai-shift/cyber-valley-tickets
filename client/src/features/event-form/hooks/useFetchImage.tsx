import type { Event } from "@/entities/event";
import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { EventFormOutput } from "../model/types";

export const useFetchImage = (
  form: UseFormReturn<EventFormOutput, unknown, EventFormOutput>,
  existingEvent?: Event,
) => {
  useEffect(() => {
    if (!existingEvent?.imageUrl) return;

    async function getFileFromUrl(url: string, filename: string) {
      const response = await fetch(url);
      const contentType = response.headers.get("Content-Type");
      const blob = await response.blob();
      return new File([blob], filename, { type: contentType?.toString() });
    }

    getFileFromUrl(
      existingEvent.imageUrl,
      `Жопа-${Math.floor(Math.random() * 1000)}`,
    ).then((data) => form.setValue("image", data));
  }, [existingEvent?.imageUrl, form.setValue]);
};
