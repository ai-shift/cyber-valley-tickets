import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTrigger,
} from "@/shared/ui/dialog";

import { DialogTitle } from "@radix-ui/react-dialog";
import { type IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { useActiveAccount } from "thirdweb/react";
import { redeem } from "../api/redeem";

// TODO: Add error handling
export const Redeem: React.FC = () => {
  const account = useActiveAccount();

  function handleDetect(detected: IDetectedBarcode[]) {
    const value = detected.at(0);
    if (!value) return;
    redeem(account, value.rawValue);
  }

  return (
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full">Redeem ticket</Button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined} className="p-16">
          <DialogTitle className="text-center text-3xl">
            Scan ticket
          </DialogTitle>
          <DialogDescription asChild>
            <Scanner onScan={handleDetect} />
          </DialogDescription>
        </DialogContent>
      </Dialog>
  );
};
