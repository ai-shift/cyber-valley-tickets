import { parseJSON } from "date-fns";
import { useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { EventFormOutput } from "../model/types";
import { getBase64, getImage } from "@/shared/lib/fileBase64Conveter";

export const useEventPersist = (
  form: UseFormReturn<EventFormOutput, unknown, EventFormOutput>,
) => {
  const formData = form.watch();
  const initial = useRef(true);

  const localString = localStorage.getItem("eventForm");

  if (localString !== null && initial.current) {
    const localData = JSON.parse(localString);
    form.reset({
      ...localData,
      image: getImage(localData.image),
      startDate: parseJSON(localData.startDate),
    });
    initial.current = false;
  }

  const storedValues = JSON.parse(localString ?? "{}");

  if (storedValues?.image?.name === formData.image?.name) {
    const cloneFormData: Record<string, unknown> = {};

    for (const key in formData) {
      if (key !== "image") {
        if (key in formData) {
          cloneFormData[key] = formData[key as keyof EventFormOutput];
        }
      }
    }

    localStorage.setItem(
      "eventForm",
      JSON.stringify({ ...storedValues, ...cloneFormData }),
    );
  } else {
    getBase64(formData.image).then((data) => {
      localStorage.setItem(
        "eventForm",
        JSON.stringify({ ...formData, image: data }),
      );
    });
  }
};
