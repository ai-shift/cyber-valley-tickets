import type { EventPlace } from "@/entities/place";
import { type EventPlaceForm, PlaceForm } from "@/features/place-form";
import { useSendTx } from "@/shared/hooks";
import { Loader } from "@/shared/ui/Loader";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { upsertPlaceW3 } from "../api/upsertPlaceW3";
import { type ModalStatus, type ModalType, PlaceDialog } from "./PlaceDialog";

type PlaceEditorProps = {
  placeForEdit?: EventPlace;
};

export const PlaceEditor: React.FC<PlaceEditorProps> = ({ placeForEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ModalStatus>("idle");
  // TODO: Keep is simple, stupid
  const [mode] = useState<ModalType>(() =>
    placeForEdit?.id ? "edit" : "creat",
  );
  const account = useActiveAccount();
  const { sendTx, error, isLoading } = useSendTx();

  const { mutate } = useMutation<unknown, Error, EventPlaceForm>({
    mutationFn: (values: EventPlaceForm) =>
      upsertPlaceW3(sendTx, values, account, placeForEdit?.id),
    onSuccess: () => {
      setStatus("success");
      setIsOpen(true);
    },
    onError: () => {
      setStatus("error");
      setIsOpen(true);
    },
  });

  // TODO: Get rid of `ModalStatus` and pass simply props
  useEffect(() => {
    if (error == null) return;
    setStatus("error");
  }, [error]);

  return (
    <div className="px-6">
      {isLoading ? (
        <Loader />
      ) : (
        <PlaceForm
          existingPlace={placeForEdit}
          disableFields={isLoading}
          onSubmit={mutate}
        />
      )}
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
