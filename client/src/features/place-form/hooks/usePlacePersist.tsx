import { useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { EventPlaceForm } from "../model/types";

export const PLACE_LOCAL_KEY = "placeForm";

// TODO: implement storage cleaning
export const usePlacePersist = (
  form: UseFormReturn<EventPlaceForm, unknown, EventPlaceForm>,
) => {
  const formData = form.watch();
  const initial = useRef(true);

  const localString = localStorage.getItem(PLACE_LOCAL_KEY);

  if (localString !== null && initial.current) {
    const localData = JSON.parse(localString);
    form.reset({
      ...localData,
    });
    initial.current = false;
  }

  localStorage.setItem(PLACE_LOCAL_KEY, JSON.stringify(formData));
};
