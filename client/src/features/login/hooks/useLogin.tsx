import { useAuthSlice } from "@/app/providers";
import type { User } from "@/entities/user";
import { apiClient } from "@/shared/api";
import { cn } from "@/shared/lib/utils";
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

  if (installedWallets.length < 1 && import.meta.env.DEV) {
    console.log("Installed wallets wasn't found");
  }

  const login = useCallback(async () => {
    if (import.meta.env.DEV) {
      console.log("[useLogin] Starting login process");
    }
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
            if (import.meta.env.DEV) {
              console.log(
                "[useLogin] Getting login payload for address:",
                params.address,
              );
            }
            try {
              const resp = await fetch(
                `${import.meta.env.PUBLIC_API_HOST}/api/auth/web3/nonce/${params.address}`,
                { credentials: "include" },
              );
              if (import.meta.env.DEV) {
                console.log(
                  "[useLogin] Nonce fetch response status:",
                  resp.status,
                );
              }
              if (!resp.ok) {
                if (import.meta.env.DEV) {
                  console.error(
                    "[useLogin] Failed to fetch nonce, status:",
                    resp.status,
                  );
                }
                throw new Error(`Failed to fetch nonce: ${resp.status}`);
              }
              const data = await resp.json();
              if (import.meta.env.DEV) {
                console.log("[useLogin] Generated login payload successfully");
              }
              return data;
            } catch (error) {
              if (import.meta.env.DEV) {
                console.error("[useLogin] Error in getLoginPayload:", error);
              }
              throw error;
            }
          },
          doLogin: async (params: VerifyLoginPayloadParams) => {
            if (import.meta.env.DEV) {
              console.log("[useLogin] Performing login with signature");
            }
            try {
              const loginResp = await fetch(
                `${import.meta.env.PUBLIC_API_HOST}/api/auth/web3/login/`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  credentials: "include",
                  body: JSON.stringify({
                    signature: params.signature,
                    ...params.payload,
                  }),
                },
              );
              if (import.meta.env.DEV) {
                console.log(
                  "[useLogin] Login API response status:",
                  loginResp.status,
                );
              }
              if (!loginResp.ok) {
                if (import.meta.env.DEV) {
                  console.error(
                    "[useLogin] Login API failed, status:",
                    loginResp.status,
                  );
                }
                throw new Error(`Login API failed: ${loginResp.status}`);
              }
              if (import.meta.env.DEV) {
                console.log(
                  "[useLogin] Login API successful, fetching current user",
                );
              }
              const { data, error } = await apiClient.GET(
                "/api/users/current/",
              );
              if (import.meta.env.DEV) {
                console.log(
                  "[useLogin] Get current user response - data:",
                  !!data,
                  "error:",
                  !!error,
                );
              }
              if (data != null) {
                if (import.meta.env.DEV) {
                  console.log("[useLogin] User data received, logging in");
                }
                authLogin(data as User);
                const expirationRaw =
                  params.payload.expiration_time ??
                  (params.payload as unknown as Record<string, string>)
                    .expiration_time;
                const expiresAt = expirationRaw ? Number(expirationRaw) : null;
                if (expiresAt && !Number.isNaN(expiresAt)) {
                  setSignature(params.signature, expiresAt);
                }
                if (import.meta.env.DEV) {
                  console.log("[useLogin] Auth login completed");
                }
                return;
              }
              if (error != null) {
                if (import.meta.env.DEV) {
                  console.error(
                    "[useLogin] Error fetching current user:",
                    error,
                  );
                }
                throw error;
              }
            } catch (error) {
              if (import.meta.env.DEV) {
                console.error("[useLogin] Error in doLogin:", error);
              }
              throw error;
            }
          },
          isLoggedIn: async () => {
            if (import.meta.env.DEV) {
              console.log("[useLogin] Checking if user is logged in");
            }
            try {
              const resp = await fetch(
                `${import.meta.env.PUBLIC_API_HOST}/api/auth/verify`,
                { credentials: "include" },
              );
              if (import.meta.env.DEV) {
                console.log(
                  "[useLogin] Auth verify response status:",
                  resp.status,
                );
              }
              const isLoggedIn = resp.status === 200;
              if (import.meta.env.DEV) {
                console.log("[useLogin] Is logged in:", isLoggedIn);
              }
              return isLoggedIn;
            } catch (error) {
              if (import.meta.env.DEV) {
                console.error("[useLogin] Error in isLoggedIn:", error);
              }
              return false;
            }
          },
          doLogout: async () => {
            if (import.meta.env.DEV) {
              console.log("[useLogin] Performing logout");
            }
            try {
              const resp = await fetch(
                `${import.meta.env.PUBLIC_API_HOST}/api/auth/logout`,
                { credentials: "include" },
              );
              if (import.meta.env.DEV) {
                console.log("[useLogin] Logout response status:", resp.status);
              }
              if (!resp.ok) {
                if (import.meta.env.DEV) {
                  console.error(
                    "[useLogin] Logout failed, status:",
                    resp.status,
                  );
                }
                throw new Error(`Logout failed: ${resp.status}`);
              }
              if (import.meta.env.DEV) {
                console.log("[useLogin] Logout successful");
              }
            } catch (error) {
              if (import.meta.env.DEV) {
                console.error("[useLogin] Error in doLogout:", error);
              }
              throw error;
            }
          },
        },
      });
      if (import.meta.env.DEV) {
        console.log("[useLogin] Wallet connected successfully:", wallet);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[useLogin] Login failed - raw error:", error);
        console.error("[useLogin] Login failed - error type:", typeof error);
        console.error(
          "[useLogin] Login failed - error is undefined:",
          error === undefined,
        );
        console.error(
          "[useLogin] Login failed - error is null:",
          error === null,
        );

        if (error === undefined || error === null) {
          console.error(
            "[useLogin] Error is undefined/null - this might be a user cancellation or thirdweb internal error",
          );
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
      }

      if (error === undefined || error === null) {
        throw new Error("Login was cancelled or failed with no specific error");
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
    <div className="w-full">
      {isConnecting ? (
        <Loader className="h-60" />
      ) : (
        <Button className={cn("w-full", className)} onClick={login}>
          {title ?? "Login"}
        </Button>
      )}
    </div>
  );
};
