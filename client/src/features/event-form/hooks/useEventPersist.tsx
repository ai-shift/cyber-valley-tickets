import { parseJSON } from "date-fns";
import { useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { EventFormOutput } from "../model/types";

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

function getBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const string = event.target?.result;
      if (typeof string !== "string") return reject("Failed to extract base64");
      const base = string.split(",")[1];
      if (base === undefined) return reject("Failed to split base64");
      resolve(
        JSON.stringify({
          type: file.type,
          name: file.name,
          base64: base,
        }),
      );
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function getImage(cover: string): File | null {
  if (!cover) return null;
  const fileObj = JSON.parse(cover);

  if (!fileObj.type || !fileObj.name || !fileObj.base64) return null;

  const { type, name, base64 } = fileObj;

  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);

  const blob = new Blob([byteArray], { type });

  try {
    const file = new File([blob], name, { type });
    return file;
  } catch (error) {
    console.error("Error creating File object:", error);
    return null;
  }
}
