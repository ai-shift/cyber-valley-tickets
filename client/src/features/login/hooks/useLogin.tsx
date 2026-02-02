import { useAuthSlice } from "@/app/providers";
import type { User } from "@/entities/user";
import { apiClient } from "@/shared/api";
import { client } from "@/shared/lib/web3";
import { injectedSupportedWalletIds } from "@/shared/lib/web3/wallets";
import { Loader } from "@/shared/ui/Loader";
import { Button } from "@/shared/ui/button";
import { useCallback, useMemo } from "react";
import type { LoginPayload, VerifyLoginPayloadParams } from "thirdweb/auth";
import { useConnectModal } from "thirdweb/react";
import { darkTheme } from "thirdweb/react";
import { createWallet, injectedProvider } from "thirdweb/wallets";

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
  const { login: authLogin, setSignature } = useAuthSlice();
  const { connect, isConnecting } = useConnectModal();

  const installedWallets = useMemo(
    () =>
      injectedSupportedWalletIds
        .filter((wallet) => injectedProvider(wallet) != null)
        .map((wallet) => createWallet(wallet)),
    [],
  );

  if (installedWallets.length < 1) {
    console.log("Installed wallets wasn't found");
  }

  const login = useCallback(async () => {
    console.log("[useLogin] Starting login process");
    try {
      const wallet = await connect({
        client,
        wallets,
        theme,
        showThirdwebBranding: false,
        auth: {
          getLoginPayload: async (params: {
            address: string;
          }): Promise<LoginPayload> => {
            console.log(
              "[useLogin] Getting login payload for address:",
              params.address,
            );
            try {
              const resp = await fetch(
                `/api/auth/web3/nonce/${params.address}`,
              );
              console.log(
                "[useLogin] Nonce fetch response status:",
                resp.status,
              );
              if (!resp.ok) {
                console.error(
                  "[useLogin] Failed to fetch nonce, status:",
                  resp.status,
                );
                throw new Error(`Failed to fetch nonce: ${resp.status}`);
              }
              const data = await resp.json();
              console.log("[useLogin] Generated login payload successfully");
              return data;
            } catch (error) {
              console.error("[useLogin] Error in getLoginPayload:", error);
              throw error;
            }
          },
          doLogin: async (params: VerifyLoginPayloadParams) => {
            console.log("[useLogin] Performing login with signature");
            try {
              const loginResp = await fetch("/api/auth/web3/login/", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  signature: params.signature,
                  ...params.payload,
                }),
              });
              console.log(
                "[useLogin] Login API response status:",
                loginResp.status,
              );
              if (!loginResp.ok) {
                console.error(
                  "[useLogin] Login API failed, status:",
                  loginResp.status,
                );
                throw new Error(`Login API failed: ${loginResp.status}`);
              }
              console.log(
                "[useLogin] Login API successful, fetching current user",
              );
              const { data, error } = await apiClient.GET(
                "/api/users/current/",
              );
              console.log(
                "[useLogin] Get current user response - data:",
                !!data,
                "error:",
                !!error,
              );
              if (data != null) {
                console.log("[useLogin] User data received, logging in");
                authLogin(data as User);
                const expirationRaw =
                  params.payload.expiration_time ??
                  (params.payload as unknown as Record<string, string>)
                    .expiration_time;
                const expiresAt = expirationRaw ? Number(expirationRaw) : null;
                if (expiresAt && !Number.isNaN(expiresAt)) {
                  setSignature(params.signature, expiresAt);
                }
                console.log("[useLogin] Auth login completed");
                return;
              }
              if (error != null) {
                console.error("[useLogin] Error fetching current user:", error);
                throw error;
              }
            } catch (error) {
              console.error("[useLogin] Error in doLogin:", error);
              throw error;
            }
          },
          isLoggedIn: async () => {
            console.log("[useLogin] Checking if user is logged in");
            try {
              const resp = await fetch("/api/auth/verify");
              console.log(
                "[useLogin] Auth verify response status:",
                resp.status,
              );
              const isLoggedIn = resp.status === 200;
              console.log("[useLogin] Is logged in:", isLoggedIn);
              return isLoggedIn;
            } catch (error) {
              console.error("[useLogin] Error in isLoggedIn:", error);
              return false;
            }
          },
          doLogout: async () => {
            console.log("[useLogin] Performing logout");
            try {
              const resp = await fetch("/api/auth/logout");
              console.log("[useLogin] Logout response status:", resp.status);
              if (!resp.ok) {
                console.error("[useLogin] Logout failed, status:", resp.status);
                throw new Error(`Logout failed: ${resp.status}`);
              }
              console.log("[useLogin] Logout successful");
            } catch (error) {
              console.error("[useLogin] Error in doLogout:", error);
              throw error;
            }
          },
        },
      });
      console.log("[useLogin] Wallet connected successfully:", wallet);
    } catch (error) {
      console.error("[useLogin] Login failed - raw error:", error);
      console.error("[useLogin] Login failed - error type:", typeof error);
      console.error(
        "[useLogin] Login failed - error is undefined:",
        error === undefined,
      );
      console.error("[useLogin] Login failed - error is null:", error === null);

      if (error === undefined || error === null) {
        console.error(
          "[useLogin] Error is undefined/null - this might be a user cancellation or thirdweb internal error",
        );
        const wrappedError = new Error(
          "Login was cancelled or failed with no specific error",
        );
        console.error("[useLogin] Wrapped error:", wrappedError);
        throw wrappedError;
      }

      if (error instanceof Error) {
        console.error("[useLogin] Error name:", error.name);
        console.error("[useLogin] Error message:", error.message);
        console.error("[useLogin] Error stack:", error.stack);
      } else {
        console.error(
          "[useLogin] Non-Error object thrown:",
          JSON.stringify(error),
        );
      }

      throw error;
    }
  }, [connect, authLogin, setSignature]);

  const buttonProps = useMemo(
    () => ({
      login,
      isConnecting,
    }),
    [login, isConnecting],
  );

  return { LoginBtn, buttonProps, login };
};

type LoginBtnProps = {
  login: () => Promise<void>;
  isConnecting: boolean;
  className?: string;
  title?: string;
};

const LoginBtn: React.FC<LoginBtnProps> = ({
  login,
  isConnecting,
  className,
  title,
}) => {
  return (
    <div>
      {isConnecting ? (
        <Loader className="h-60" />
      ) : (
        <Button className={className} onClick={login}>
          {title ?? "Login"}
        </Button>
      )}
    </div>
  );
};
