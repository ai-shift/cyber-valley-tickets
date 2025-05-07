import { CustomModal, CustomModalWindow } from "@/shared/ui/CustomModal";
import { Button } from "@/shared/ui/button";

type PlaceSuccessDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};
export const PlaceSuccessDialog: React.FC<PlaceSuccessDialogProps> = ({
  open,
  setOpen,
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
            Place created!
          </h2>
          <p className="text-muted/70 text-md text-center">
            New place will appear within 15 minutes
          </p>
          <Button
            variant="secondary"
            className="mx-auto block"
            onClick={() => setOpen(false)}
          >
            Understand
          </Button>
        </div>
      </CustomModalWindow>
    </CustomModal>
  );
};
