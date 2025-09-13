import { client } from "@/shared/lib/web3";
import { Button } from "@/shared/ui/button";
import { useActiveAccount, useConnectModal } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";

const inAppWallet = createWallet("inApp", {
  auth: {
    options: ["phone", "email"],
    mode: "popup",
  },
});

export const InAppWalletDemo: React.FC = () => {
  const account = useActiveAccount();
  const { connect } = useConnectModal();

  const connectInAppWallet = async () => {
    try {
      await connect({
        client,
        wallets: [inAppWallet],
        showThirdwebBranding: false,
      });
    } catch (error) {
      console.error("Failed to connect in-app wallet:", error);
    }
  };

  if (account) {
    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">✅ Wallet Connected</h3>
        <p className="text-sm">Address: {account.address}</p>
        <p className="text-sm text-muted-foreground">
          {inAppWallet && "Using In-App Wallet"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">🔐 In-App Wallet Demo</h3>
      <p className="text-sm text-muted-foreground">
        Connect using phone number or email - no external wallet required!
      </p>
      <Button onClick={connectInAppWallet} className="w-full">
        Connect with Phone/Email
      </Button>
    </div>
  );
};
