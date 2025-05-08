import { type EventPlaceForm, PlaceForm } from "@/features/place-form";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { create } from "../api/create";
import { PlaceSuccessDialog } from "./PlaceSuccessDialog";

export const CreatePlace: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const account = useActiveAccount();

  const { mutate, isPending } = useMutation({
    mutationFn: (values: EventPlaceForm) => create(values, account),
    onSuccess: console.log,
    onError: console.error,
  });

  return (
    <div className="px-6">
      <PlaceForm disableFields={isPending} onSubmit={mutate} />
      <PlaceSuccessDialog open={isSuccess} setOpen={setIsSuccess} />
    </div>
  );
};
