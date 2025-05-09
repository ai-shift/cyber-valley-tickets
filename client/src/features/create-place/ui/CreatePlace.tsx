import { type EventPlaceForm, PlaceForm } from "@/features/place-form";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { createPlaceW3 } from "../api/createPlaceW3";
import { type ModalStatus, PlaceDialog } from "./PlaceDialog";

export const CreatePlace: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ModalStatus>("");
  const account = useActiveAccount();

  const { mutate, isPending } = useMutation({
    mutationFn: (values: EventPlaceForm) => createPlaceW3(values, account),
    onSuccess: () => {
      setStatus("success");
      setIsOpen(true);
    },
    onError: () => {
      setStatus("error");
      setIsOpen(true);
    },
  });

  return (
    <div className="px-6">
      <PlaceForm disableFields={isPending} onSubmit={mutate} />
      <PlaceDialog
        open={isOpen}
        setOpen={setIsOpen}
        status={status}
        clearStatus={() => setStatus("")}
      />
    </div>
  );
};
