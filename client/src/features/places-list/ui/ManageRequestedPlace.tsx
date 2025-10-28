import { useState } from "react"

import type { EventPlace } from "@/entities/place"
import { Button } from "@/shared/ui/button"
import { Check, X } from "lucide-react"

import { approveEventPlace, declineEventPlace } from "@/shared/lib/web3"
import { AcceptDialog } from "@/shared/ui/AcceptDialog"
import { ResultDialog } from "@/shared/ui/ResultDialog"
import { useActiveAccount } from "thirdweb/react"

type ManageRequestedPlaceProps = {
  place: EventPlace
}

const manageMapper = {
  "approve": approveEventPlace,
  "decline": declineEventPlace,
}

export const ManageRequestedPlace: React.FC<ManageRequestedPlaceProps> = ({place}) => {
  const [showResult, setShowResult] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const account = useActiveAccount()

  async function submitHandler(status: "approve" | "decline") {
    if (account == null) {
      return
    }
    manageMapper[status](account, BigInt(place.id))
      .then(() => {
        setShowResult(true);
        setStatus("success")
      })
      .catch(() => {
        setShowResult(true);
        setStatus("error")
      })
  }

return (
  <div className="flex gap-3">
      <AcceptDialog title="Are you sure you want to approve the event place?" option="accept" confirmFn={() => submitHandler("approve")}>
        <Button variant="secondary">
          <Check />
        </Button>
      </AcceptDialog>
      <AcceptDialog title="Are you sure you want to decline the event place?" option="decline" confirmFn={() => submitHandler("decline")}>
        <Button variant="destructive">
          <X />
        </Button>
      </AcceptDialog>
      <ResultDialog
        open={showResult}
        setOpen={setShowResult}
        failure={status === 'error'}
        onConfirm={() => setStatus("idle")} 
        title={status === "success" ? "Success" : status === "error" ? "Error" : ""}
        body={status === "success" ? "The results will take effect soon" : status === "error" ? "Some error happen. Please try again later" : ""}
      />
  </div>
  )
}
