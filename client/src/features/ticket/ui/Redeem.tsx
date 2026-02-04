import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/shared/ui/dialog";

import { DialogTitle } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { type IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { useActiveAccount } from "thirdweb/react";
import { redeem, useEventStatus } from "../api/redeem";

export type RedeemProps = {
  eventId: number;
};

// TODO: Add error handling
export const Redeem: React.FC<RedeemProps> = ({ eventId }) => {
  const account = useActiveAccount();
  const { data } = useQuery(useEventStatus(eventId));

  async function handleDetect(detected: IDetectedBarcode[]) {
    const value = detected.at(0);
    if (!value) return;
    try {
      await redeem(account, value.rawValue);
    } catch (e) {
      alert("Failed to redeem ticket");
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">Redeem ticket</Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="p-16">
        <DialogTitle className="text-center text-3xl">Scan ticket</DialogTitle>
        <Scanner onScan={handleDetect} />
        {/* NOTE: IDK why openapi-typescript marks it as possible undefined */}
        {data?.tickets && (
          <div className="text-center">
            <p>
              <span>Total tickets:</span>
              {data.tickets.total}
            </p>
            <p>
              <span>Redeemed:</span>
              {data.tickets.redeemed}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
