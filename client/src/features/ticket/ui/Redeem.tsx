import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/shared/ui/dialog";

import {
  fetchSiwePayload,
  fetchSiweStatus,
  fetchSiweVerify,
} from "@/shared/lib/siwe/api";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { type IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { redeem, useEventStatus } from "../api/redeem";

export type RedeemProps = {
  eventId: number;
};

// TODO: Add error handling
export const Redeem: React.FC<RedeemProps> = ({ eventId }) => {
  const account = useActiveAccount();
  const { data } = useQuery(useEventStatus(eventId));
  const [proofToken, setProofToken] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isTrusted, setIsTrusted] = useState(false);

  useEffect(() => {
    const addr = account?.address;
    if (!addr) {
      setProofToken(null);
      setIsTrusted(false);
      return;
    }

    fetchSiweStatus({ address: addr, scope: "ticket:verify" })
      .then((s) => {
        setIsTrusted(s.trusted);
        setProofToken(s.trusted ? "cookie" : null);
      })
      .catch(() => {
        setIsTrusted(false);
        setProofToken(null);
      });
  }, [account?.address]);

  const signToVerify = async () => {
    if (!account) {
      alert("No active wallet");
      return;
    }
    setIsSigning(true);
    try {
      const addr = account.address;
      const { payload, message } = await fetchSiwePayload({
        address: addr,
        purpose: "staff_verify",
      });
      const signature = await account.signMessage({ message });
      await fetchSiweVerify({ payload, signature });
      setIsTrusted(true);
      setProofToken("cookie");
    } catch (e) {
      console.error(e);
      alert("Failed to sign");
    } finally {
      setIsSigning(false);
    }
  };

  async function handleDetect(detected: IDetectedBarcode[]) {
    const value = detected.at(0);
    if (!value) return;
    try {
      await redeem(account, value.rawValue, proofToken);
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
        {!isTrusted ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-center">
              Staff verification requires a signed message.
            </p>
            <Button
              onClick={signToVerify}
              disabled={isSigning}
              className="w-full"
            >
              {isSigning ? "Signing..." : "Sign to start scanning"}
            </Button>
          </div>
        ) : (
          <Scanner onScan={handleDetect} />
        )}
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
