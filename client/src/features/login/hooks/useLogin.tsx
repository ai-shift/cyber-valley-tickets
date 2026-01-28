import { useAuthSlice } from "@/app/providers";
import type { User } from "@/entities/user";
import { apiClient } from "@/shared/api";
import { client } from "@/shared/lib/web3";
import { Loader } from "@/shared/ui/Loader";
import { Button } from "@/shared/ui/button";
import type { LoginPayload, VerifyLoginPayloadParams } from "thirdweb/auth";
import { useConnectModal } from "thirdweb/react";
import { darkTheme } from "thirdweb/react";
import { createWallet, injectedProvider } from "thirdweb/wallets";
import { injectedSupportedWalletIds } from "@/shared/lib/web3/wallets";

const wallets = [
  createWallet("inApp", {
    auth: {
      options: ["phone", "email", "telegram"],
      mode: "popup",
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

const theme = darkTheme({
  colors: {
    borderColor: "var(--secondary)",
    accentButtonBg: "var(--primary)",
    accentButtonText: "var(--foreground)",
    accentText: "var(--primary)",
    modalBg: "var(--background)",
    primaryButtonBg: "var(--primary)",
    primaryButtonText: "var(--foreground)",
    secondaryButtonBg: "#010101",
    secondaryButtonText: "#e2e2e2",
    secondaryText: "#e2e2e2",
  },
  fontFamily: "var(--font-chakra-petch)",
});

export const useLogin = () => {
  const { login: authLogin } = useAuthSlice();
  const { connect, isConnecting } = useConnectModal();

  const installedWallets = injectedSupportedWalletIds
    .filter((wallet) => injectedProvider(wallet) != null)
    .map((wallet) => createWallet(wallet));

  if (installedWallets.length < 1) {
    console.log("Installed wallets wasn't found");
  }

  const login = async () => {
    const wallet = await connect({
      client,
      wallets,
      theme,
      showThirdwebBranding: false,
      auth: {
        getLoginPayload: async (params: {
          address: string;
        }): Promise<LoginPayload> => {
          const resp = await fetch(`/api/auth/web3/nonce/${params.address}`);
          console.log("Generated");
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
            authLogin(data.data as User);
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
    console.log("connected", wallet);
  };

  const LoginBtn = () => (
    <div>
      {isConnecting ? (
        <Loader className="h-60" />
      ) : (
        <Button onClick={login}>Login</Button>
      )}
    </div>
  );
  return { LoginBtn };
};
