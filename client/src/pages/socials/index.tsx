import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { useAuthSlice } from "@/app/providers";
import { type Socials, upsertUserSocials } from "@/entities/user";
import { SocialsForm } from "@/features/socials-form";
import {
  fetchSiwePayload,
  fetchSiweStatus,
  fetchSiweVerify,
} from "@/shared/lib/siwe/api";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Button } from "@/shared/ui/button";
import { useActiveAccount } from "thirdweb/react";

export const SocialsPage: React.FC = () => {
  const { user } = useAuthSlice();
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const account = useActiveAccount();
  const [isTrusted, setIsTrusted] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isCheckingTrust, setIsCheckingTrust] = useState(true);

  useEffect(() => {
    if (!account?.address) {
      setIsTrusted(false);
      setIsCheckingTrust(false);
      return;
    }

    // Check server-side trust cookie
    fetchSiweStatus({ address: account.address, scope: "ticket:nonce" })
      .then((s) => {
        setIsTrusted(s.trusted);
      })
      .catch(() => {
        setIsTrusted(false);
      })
      .finally(() => {
        setIsCheckingTrust(false);
      });
  }, [account?.address]);

  async function handleSubmit(socials: Socials) {
    setError(false);
    const { response } = await upsertUserSocials(socials);
    if (!response.ok) {
      setError(true);
      console.error("Failed to set socials");
    }
    navigate(-1);
  }

  const signToContinue = async () => {
    if (!account) {
      alert("No active wallet");
      return;
    }
    setIsSigning(true);
    try {
      const addr = account.address;
      const { payload, message } = await fetchSiwePayload({
        address: addr,
        purpose: "ticket_qr",
      });
      const signature = await account.signMessage({ message });
      await fetchSiweVerify({ payload, signature });
      setIsTrusted(true);
    } catch (e) {
      console.error(e);
      alert("Failed to sign");
    } finally {
      setIsSigning(false);
    }
  };

  if (!user) return null;

  return (
    <PageContainer name="Socials">
      {isCheckingTrust ? (
        <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      ) : !isTrusted ? (
        <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-muted-foreground">
            To protect your social information, please sign a message to prove
            you own this wallet.
          </p>
          <Button
            className="w-full max-w-sm"
            onClick={signToContinue}
            disabled={isSigning}
          >
            {isSigning ? "Signing..." : "Sign to continue"}
          </Button>
        </div>
      ) : (
        <SocialsForm
          onSubmit={handleSubmit}
          existingSocials={user.socials[0]}
          userAddress={user.address}
        />
      )}
      {error && (
        <p className="text-center py-6 text-lg text-red-500">
          Some problem occured while setting socials. <br /> Try again.
        </p>
      )}
    </PageContainer>
  );
};
