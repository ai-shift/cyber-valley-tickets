import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/shared/ui/dialog";

import { DialogTitle } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { type IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { useActiveAccount } from "thirdweb/react";
import { useEffect, useState } from "react";
import { fetchSiwePayload, fetchSiweVerify } from "@/shared/lib/siwe/api";
import { getStoredProof, setStoredProof } from "@/shared/lib/siwe/proofStorage";
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

  useEffect(() => {
    const addr = account?.address;
    if (!addr) {
      setProofToken(null);
      return;
    }
    setProofToken(getStoredProof(addr, "staff_verify")?.token ?? null);
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
      const verified = await fetchSiweVerify({ payload, signature });
      setStoredProof(addr, "staff_verify", {
        token: verified.proof_token,
        expiresAt: verified.expires_at,
      });
      setProofToken(verified.proof_token);
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
        {!proofToken ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-center">
              Staff verification requires a signed message.
            </p>
            <Button onClick={signToVerify} disabled={isSigning} className="w-full">
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
