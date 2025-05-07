import { type EventPlaceForm, PlaceForm } from "@/features/place-form";
import { useMutation } from "@tanstack/react-query";
import { create } from "../api/create";
import { useState } from "react";
import { PlaceSuccessDialog } from "./PlaceSuccessDialog";

export const CreatePlace: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);

  const { mutate } = useMutation({
    mutationFn: (values: EventPlaceForm) => create(values),
    onSuccess: () => {},
  });

  return (
    <div>
      <PlaceForm onSubmit={mutate} />
      <PlaceSuccessDialog open={isSuccess} setOpen={setIsSuccess} />
    </div>
  );
};
