import { CustomModal, CustomModalWindow } from "@/shared/ui/CustomModal";
import { Success } from "@/shared/ui/Success";
import { Button } from "@/shared/ui/button";

type OrderSuccessDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  navigateFn: () => void;
  successMsg: string;
};

export const OrderSuccessDialog: React.FC<OrderSuccessDialogProps> = ({
  open,
  setOpen,
  navigateFn,
  successMsg,
}) => {
  return (
    <CustomModal open={open} setOpen={setOpen}>
      <CustomModalWindow>
        <div className="flex flex-col gap-3">
          <Success />
          <h2 className="text-muted font-semibold text-lg text-center">
            Payment successful!
          </h2>
          <p className="text-muted/70 text-md text-center">{successMsg}</p>
          <Button
            variant="secondary"
            className="mx-auto block"
            onClick={() => navigateFn()}
          >
            Understand
          </Button>
        </div>
      </CustomModalWindow>
    </CustomModal>
  );
};
