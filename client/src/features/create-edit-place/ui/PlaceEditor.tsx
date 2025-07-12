import type { EventPlace } from "@/entities/place";
import { type EventPlaceForm, PlaceForm } from "@/features/place-form";
import { useSendTx } from "@/shared/hooks";
import { Loader } from "@/shared/ui/Loader";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { upsertPlaceW3 } from "../api/upsertPlaceW3";

type PlaceEditorProps = {
  placeForEdit?: EventPlace;
};

export const PlaceEditor: React.FC<PlaceEditorProps> = ({ placeForEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const account = useActiveAccount();
  const { sendTx, data: txHash, isLoading } = useSendTx();

  const { mutate, isSuccess, isError } = useMutation<
    unknown,
    Error,
    EventPlaceForm
  >({
    mutationFn: (values: EventPlaceForm) =>
      upsertPlaceW3(sendTx, values, account, placeForEdit?.id),
    onSuccess: () => {
      setIsOpen(true);
    },
    onError: () => {
      setIsOpen(true);
    },
  });

  const mode = placeForEdit?.id ? "edit" : "creat";
  const dialogTitle = isSuccess
    ? `Place ${mode}ed!`
    : isError
      ? "Someting went wrong!"
      : "Oops";

  let dialogBody = isSuccess
    ? `Place will be ${mode}ed within several minutes.`
    : isError
      ? "Some error occured during transation. Please check your wallet for more information."
      : "Oops";

  if (txHash != null) {
    dialogBody += `\ntx hash: ${txHash}`;
  }

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
      <ResultDialog
        open={isOpen}
        setOpen={setIsOpen}
        title={dialogTitle}
        body={dialogBody}
        onConfirm={() => setIsOpen(false)}
        failure={isError}
      />
    </div>
  );
};
