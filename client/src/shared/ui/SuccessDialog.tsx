import { CustomModal, CustomModalWindow } from "@/shared/ui/CustomModal";
import { Success } from "@/shared/ui/Success";
import { Button } from "@/shared/ui/button";

type SuccessDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  body: string;
};

export const SuccessDialog: React.FC<SuccessDialogProps> = ({
  open,
  setOpen,
  onConfirm,
  title,
  body,
}) => {
  return (
    <CustomModal open={open} setOpen={setOpen}>
      <CustomModalWindow>
        <div className="flex flex-col gap-3">
          <Success />
          <h2 className="text-muted font-semibold text-lg text-center">
            {title}
          </h2>
          <p className="text-muted/70 text-md text-center">{body}</p>
          <Button
            variant="secondary"
            className="mx-auto block"
            onClick={onConfirm}
          >
            Understand
          </Button>
        </div>
      </CustomModalWindow>
    </CustomModal>
  );
};
