import { useAuthSlice } from "@/app/providers";
import type { User } from "@/entities/user";
import { apiClient } from "@/shared/api";
import { client } from "@/shared/lib/web3";
import { Button } from "@/shared/ui/button";
import { useState } from "react";
import type { LoginPayload, VerifyLoginPayloadParams } from "thirdweb/auth";
import { useActiveAccount, useConnectModal } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { CustomSMSLogin } from "./CustomSMSLogin";

const inAppWallet = createWallet("inApp", {
  auth: {
    options: ["phone", "email"],
    mode: "popup",
  },
});

export const InAppWalletDemo: React.FC = () => {
  const [showCustom, setShowCustom] = useState(false);
  const account = useActiveAccount();
  const { connect } = useConnectModal();
  const { login } = useAuthSlice();

  const connectInAppWallet = async () => {
    try {
      const wallet = await connect({
        client,
        wallets: [inAppWallet],
        showThirdwebBranding: false,
        auth: {
          getLoginPayload: async (params: {
            address: string;
          }): Promise<LoginPayload> => {
            const resp = await fetch(`/api/auth/web3/nonce/${params.address}`);
            return await resp.json();
          },
          doLogin: async (params: VerifyLoginPayloadParams) => {
            await fetch("/api/auth/web3/login/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                signature: params.signature,
                ...params.payload,
              }),
            });
            apiClient.GET("/api/users/current/").then((data) => {
              login(data.data as User);
            });
          },
          isLoggedIn: async () => {
            const resp = await fetch("api/auth/verify");
            return resp.status === 200;
          },
          doLogout: async () => {
            await fetch("api/auth/logout");
          },
        },
      });
      console.log("connected in-app wallet", wallet);
    } catch (error) {
      console.error("Failed to connect in-app wallet:", error);
    }
  };

  if (account) {
    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">✅ Wallet Connected</h3>
        <p className="text-sm">Address: {account.address}</p>
        <p className="text-sm text-muted-foreground">Using In-App Wallet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showCustom ? (
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold">🔐 In-App Wallet Options</h3>

          <div className="space-y-2">
            <Button onClick={connectInAppWallet} className="w-full">
              Standard Thirdweb Auth (Phone/Email)
            </Button>

            <Button
              onClick={() => setShowCustom(true)}
              variant="secondary"
              className="w-full"
            >
              Custom SMS Provider (Mocked)
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Try the custom SMS option to test the mocked provider with hardcoded
            code: 123456
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <CustomSMSLogin />
          <Button
            onClick={() => setShowCustom(false)}
            variant="secondary"
            size="sm"
          >
            ← Back to options
          </Button>
        </div>
      )}
    </div>
  );
};
