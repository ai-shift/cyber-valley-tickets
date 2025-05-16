import { CustomModal, CustomModalWindow } from "@/shared/ui/CustomModal";
import { Button } from "@/shared/ui/button";

export type ModalStatus = "success" | "error" | "idle";
export type ModalType = "edit" | "create";

type PlaceDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  status: ModalStatus;
  clearStatus: () => void;
  mode: ModalType;
};

export const PlaceDialog: React.FC<PlaceDialogProps> = ({
  open,
  setOpen,
  status,
  clearStatus,
  mode,
}) => {
  const messages: { [P in ModalStatus]: string } = {
    error:
      "Some error occured during transation. Please check your wallet for more information.",
    success: `Place will be ${mode}ed within several minutes.`,
    idle: "",
  };

  return (
    <CustomModal open={open} setOpen={setOpen}>
      <CustomModalWindow>
        <div className="flex flex-col gap-3">
          <img
            className="aspect-square h-40 mx-auto my-7"
            src={`/icons/${status === "success" ? "price_3" : "price_1"}.svg`}
            alt="purchase"
          />
          <h2 className="text-muted font-semibold text-lg text-center">
            {status === "success" ? `Place ${mode}ed!` : "Someting went wrong!"}
          </h2>
          <p className="text-muted/70 text-md text-center">
            {messages[status]}
          </p>
          <Button
            variant={status === "success" ? "secondary" : "destructive"}
            className="mx-auto block"
            onClick={() => {
              clearStatus();
              setOpen(false);
            }}
          >
            Understand
          </Button>
        </div>
      </CustomModalWindow>
    </CustomModal>
  );
};
