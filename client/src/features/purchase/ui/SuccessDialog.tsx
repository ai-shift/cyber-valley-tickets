import { CustomModal, CustomModalWindow } from "@/shared/ui/CustomModal";
import { Button } from "@/shared/ui/button";

type SuccessDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  navigateFn: () => void;
  successMsg: string;
};
export const SuccessDialog: React.FC<SuccessDialogProps> = ({
  open,
  setOpen,
  navigateFn,
  successMsg,
}) => {
  return (
    <CustomModal open={open} setOpen={setOpen}>
      <CustomModalWindow>
        <div className="flex flex-col gap-3">
          <img
            className="aspect-square h-40 mx-auto my-7"
            src="/icons/price_3.svg"
            alt="purchase"
          />
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
