import { useRefreshSlice } from "@/app/providers";
import { client } from "@/shared/lib/web3";
import { injectedSupportedWalletIds } from "@/shared/lib/web3/wallets";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { Button } from "@/shared/ui/button";
import type { LoginPayload, VerifyLoginPayloadParams } from "thirdweb/auth";
import { darkTheme } from "thirdweb/react";
import { useConnectModal } from "thirdweb/react";
import { createWallet, injectedProvider } from "thirdweb/wallets";

const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

const theme = darkTheme({
  colors: {
    borderColor: "var(--background)",
    accentButtonBg: "var(--primary)",
    accentButtonText: "var(--foreground)",
    accentText: "var(--primary)",
    modalBg: "var(--background)",
    primaryButtonBg: "var(--primary)",
    primaryButtonText: "var(--foreground)",
    secondaryButtonBg: "var(--secondary)",
    secondaryButtonText: "var(--foreground)",
  },
  fontFamily: "var(--font-chakra-petch)",
});

export const Login: React.FC = () => {
  const { setHasJWT } = useRefreshSlice();
  const { connect, isConnecting } = useConnectModal();

  const installedWallets = injectedSupportedWalletIds
    .filter((wallet) => injectedProvider(wallet) != null)
    .map((wallet) => createWallet(wallet));

  if (installedWallets.length < 1) {
    console.log("Installed wallets wasn't found");
  }

  const gotError = null;
  const isLoading = isConnecting;

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-1/5 w-full" />
      <div className="text-center space-y-5">
        {isLoading && <Loader className="h-60" />}
        {isLoading || (
          <>
            <h1 className="text-2xl">Connect wallet to login</h1>
            <div className="h-1/5 w-full" />
            <Button
              onClick={async () => {
                const wallet = await connect({
                  client,
                  wallets,
                  theme,
                  auth: {
                    getLoginPayload: async (params: {
                      address: string;
                    }): Promise<LoginPayload> => {
                      const resp = await fetch(
                        `/api/auth/web3/nonce/${params.address}`,
                      );
                      console.log("Generated");
                      return await resp.json();
                    },
                    doLogin: async (params: VerifyLoginPayloadParams) => {
                      console.log("kek");
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
                      console.log("lol");
                      setHasJWT(true);
                      console.log("fuck");
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
                console.log("connected", wallet);
              }}
            >
              Connect
            </Button>
          </>
        )}

        {gotError && (
          <ErrorMessage
            className="capitalize text-destructive"
            errors={gotError}
          />
        )}
      </div>
    </div>
  );
};
