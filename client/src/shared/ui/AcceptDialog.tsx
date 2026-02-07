import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { useEffect, useState } from "react";

type AcceptDialogProps = {
  confirmFn: () => void;
  title: string;
  children: React.ReactNode;
  option: "accept" | "decline";
  confirmDisabled?: boolean;
  confirmText?: string;
};

export const AcceptDialog: React.FC<AcceptDialogProps> = ({
  confirmFn,
  title,
  children,
  option,
  confirmDisabled = false,
  confirmText,
}) => {
  const [timer, setTimer] = useState(5);

  useEffect(() => {
    if (option === "accept" || timer < 1) return;

    const timeout = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => {
      clearInterval(timeout);
    };
  }, [timer, option]);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setTimer(5);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent aria-describedby={undefined} className="py-7">
        <DialogTitle>
          <p className="text-muted py-7 text-2xl">{title}</p>
        </DialogTitle>
        <DialogClose className="flex justify-center items-center" asChild>
          <span>
            <Button
              disabled={
                confirmDisabled || (timer !== 0 && option === "decline")
              }
              variant={option === "decline" ? "destructive" : "secondary"}
              onClick={confirmFn}
            >
              {confirmText ?? "Confirm"} {(option === "decline" && timer) || ""}
            </Button>
          </span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
