import {
  type EventPlaceForm,
  PlaceForm,
  cleanPlaceLocal,
} from "@/features/place-form";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { requestPlace } from "../api/requestPlace";

export const RequestEventPlace = () => {
  const [showResult, setShowResult] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isLoading, setIsLoading] = useState(false);
  const account = useActiveAccount();

  function handleSubmit(placeValues: EventPlaceForm) {
    if (!account) {
      return;
    }
    setIsLoading(true);
    requestPlace(account, placeValues)
      .then(() => {
        setStatus("success");
        setShowResult(true);
        cleanPlaceLocal();
      })
      .catch(() => {
        setStatus("error");
        setShowResult(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="p-5">
      <PlaceForm disableFields={isLoading} onSubmit={handleSubmit} />
      <ResultDialog
        open={showResult}
        setOpen={setShowResult}
        failure={status === "error"}
        onConfirm={() => setStatus("idle")}
        title={
          status === "success" ? "Success" : status === "error" ? "Error" : ""
        }
        body={
          status === "success"
            ? "Request for creating the event place successfuly sent"
            : status === "error"
              ? "Some error happen. Please try again later"
              : ""
        }
      />
    </div>
  );
};
