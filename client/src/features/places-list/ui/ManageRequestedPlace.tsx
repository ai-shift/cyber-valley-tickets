import { useState } from "react";

import type { EventPlace } from "@/entities/place";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Check, X } from "lucide-react";

import { approveEventPlace, declineEventPlace } from "@/shared/lib/web3";
import { AcceptDialog } from "@/shared/ui/AcceptDialog";
import { ResultDialog } from "@/shared/ui/ResultDialog";
import { useActiveAccount } from "thirdweb/react";

type ManageRequestedPlaceProps = {
  place: EventPlace;
};

export const ManageRequestedPlace: React.FC<ManageRequestedPlaceProps> = ({
  place,
}) => {
  if (place.status !== "submitted") {
    return null;
  }

  const [showResult, setShowResult] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [depositSize, setDepositSize] = useState<string>("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const account = useActiveAccount();

  async function handleApprove() {
    if (account == null || depositSize === "") {
      return;
    }
    const deposit = BigInt(depositSize);
    if (deposit <= 0) {
      setShowResult(true);
      setStatus("error");
      return;
    }
    approveEventPlace(account, BigInt(place.id), deposit)
      .then(() => {
        setShowResult(true);
        setStatus("success");
        setShowApproveDialog(false);
        setDepositSize("");
      })
      .catch(() => {
        setShowResult(true);
        setStatus("error");
      });
  }

  async function handleDecline() {
    if (account == null) {
      return;
    }
    declineEventPlace(account, BigInt(place.id))
      .then(() => {
        setShowResult(true);
        setStatus("success");
      })
      .catch(() => {
        setShowResult(true);
        setStatus("error");
      });
  }

  return (
    <div className="flex gap-3">
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogTrigger asChild>
          <Button variant="secondary">
            <Check />
          </Button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="py-7">
          <DialogTitle>
            <p className="text-muted py-7 text-2xl">Approve Event Place</p>
          </DialogTitle>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-size">Event Deposit Size (USDT)</Label>
              <Input
                id="deposit-size"
                type="number"
                placeholder="Enter deposit amount"
                value={depositSize}
                onChange={(e) => setDepositSize(e.target.value)}
                min="1"
              />
              <p className="text-sm text-muted-foreground">
                This amount will be required from event creators when submitting
                events for this place.
              </p>
            </div>
            <DialogClose className="flex justify-center items-center" asChild>
              <span>
                <Button
                  variant="secondary"
                  onClick={handleApprove}
                  disabled={depositSize === "" || BigInt(depositSize) <= 0}
                >
                  Confirm
                </Button>
              </span>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
      <AcceptDialog
        title="Are you sure you want to decline the event place?"
        option="decline"
        confirmFn={handleDecline}
      >
        <Button variant="destructive">
          <X />
        </Button>
      </AcceptDialog>
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
            ? "The results will take effect soon"
            : status === "error"
              ? "Some error happen. Please try again later"
              : ""
        }
      />
    </div>
  );
};
