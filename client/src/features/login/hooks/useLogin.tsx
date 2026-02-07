import { useAuthSlice } from "@/app/providers";
import type { User } from "@/entities/user";
import { cn } from "@/shared/lib/utils";
import { client, cvlandChain, wallets } from "@/shared/lib/web3";
import { connectTheme } from "@/shared/lib/web3/connectTheme";
import { walletConnectConfig } from "@/shared/lib/web3/walletConnect";
import { Loader } from "@/shared/ui/Loader";
import { Button } from "@/shared/ui/button";
import { useCallback, useMemo } from "react";
import { useActiveAccount, useConnectModal } from "thirdweb/react";

export const useLogin = () => {
  const { setStatus, setUser, setAddress } = useAuthSlice();
  const { connect, isConnecting } = useConnectModal();
  const activeAccount = useActiveAccount();

  const login = useCallback(async () => {
    try {
      let address = activeAccount?.address?.toLowerCase();
      if (!address) {
        const w = await connect({
          client,
          chain: cvlandChain,
          wallets,
          theme: connectTheme,
          showThirdwebBranding: false,
          walletConnect: walletConnectConfig,
        });
        address = w.getAccount()?.address?.toLowerCase();
      }

      if (!address) {
        throw new Error("No wallet address available");
      }

      setAddress(address);
      setStatus("connected");

      const url = new URL(
        "/api/users/current/",
        import.meta.env.PUBLIC_API_HOST,
      );
      url.searchParams.set("address", address);
      const resp = await fetch(url.toString(), { credentials: "include" });
      if (!resp.ok) {
        setUser(null);
        return;
      }
      setUser((await resp.json()) as User);
    } catch (error) {
      if (error === undefined || error === null) {
        throw new Error("Login was cancelled or failed with no specific error");
      }

      throw error;
    }
  }, [activeAccount?.address, connect, setAddress, setStatus, setUser]);

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
          {title ?? "Connect wallet"}
        </Button>
      )}
    </div>
  );
};
