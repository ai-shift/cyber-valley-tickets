import animationData from "@/lotties/vagina.json";
import { CustomModal, CustomModalWindow } from "@/shared/ui/CustomModal";
import { Button } from "@/shared/ui/button";
import Lottie from "lottie-react";
import { ExternalLink } from "lucide-react";

type ResultDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  body: string;
  failure?: boolean;
  txHash?: string | null;
};

export const ResultDialog: React.FC<ResultDialogProps> = ({
  open,
  setOpen,
  onConfirm,
  title,
  body,
  failure,
  txHash,
}) => {
  return (
    <CustomModal open={open} setOpen={setOpen}>
      <CustomModalWindow>
        <div className="flex flex-col gap-3">
          <div className="grow-1">
            {failure ? (
              <img src="/icons/price_1.svg" alt="purchase" />
            ) : (
              <Lottie animationData={animationData} />
            )}
          </div>
          <h2 className="text-muted font-semibold text-lg text-center">
            {title}
          </h2>
          <p className="text-muted/70 text-md text-center">
            {body}
            {txHash != null && (
              <>
                <br />
                <a
                  className="text-secondary"
                  target="_blank"
                  rel="noreferrer noopener"
                  href={`https://etherscan.io/tx/${txHash}`}
                >
                  <span className="underline">Show transaction</span>{" "}
                  <ExternalLink className="inline h-4" />
                </a>
              </>
            )}
          </p>
          <Button
            variant={failure ? "destructive" : "default"}
            className="mx-auto block"
            onClick={() => {
              setOpen(false)
              onConfirm()
            }}
          >
            Understand
          </Button>
        </div>
      </CustomModalWindow>
    </CustomModal>
  );
};
