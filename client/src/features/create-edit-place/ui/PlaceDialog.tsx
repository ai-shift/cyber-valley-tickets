import { ResultDialog } from "@/shared/ui/ResultDialog";

export type ModalStatus = "success" | "error" | "idle";
export type ModalType = "edit" | "creat";

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
    <ResultDialog
      open={open}
      setOpen={setOpen}
      title={status === "success" ? `Place ${mode}ed!` : "Someting went wrong!"}
      body={messages[status]}
      onConfirm={() => {
        clearStatus();
        setOpen(false);
      }}
      failure={status !== "success"}
    />
  );
};
