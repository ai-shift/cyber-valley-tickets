import { type EventPlaceForm, PlaceForm } from "@/features/place-form";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { upsertPlaceW3 } from "../api/upsertPlaceW3";
import { type ModalStatus, type ModalType, PlaceDialog } from "./PlaceDialog";
import type { EventPlace } from "@/entities/place";

type PlaceEditorProps = {
  placeForEdit?: EventPlace;
};

export const PlaceEditor: React.FC<PlaceEditorProps> = ({ placeForEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ModalStatus>("idle");
  const [mode] = useState<ModalType>(() =>
    placeForEdit?.id ? "edit" : "create",
  );
  const account = useActiveAccount();

  const { mutate, isPending } = useMutation({
    mutationFn: (values: EventPlaceForm) =>
      upsertPlaceW3(values, account, placeForEdit?.id),
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
      <PlaceForm
        existingPlace={placeForEdit}
        disableFields={isPending}
        onSubmit={mutate}
      />
      <PlaceDialog
        open={isOpen}
        setOpen={setIsOpen}
        status={status}
        clearStatus={() => setStatus("idle")}
        mode={mode}
      />
    </div>
  );
};
