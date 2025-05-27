import { useRefreshSlice } from "@/app/providers";
import { cn } from "@/shared/lib/utils";
import { injectedSupportedWalletIds } from "@/shared/lib/web3/wallets";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { Button } from "@/shared/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useConnect, useWalletImage, useWalletInfo } from "thirdweb/react";
import { createWallet, injectedProvider } from "thirdweb/wallets";
import type { Wallet } from "thirdweb/wallets";
import { type LoginStatus, login } from "../api/login";

export const Login: React.FC = () => {
  const { setHasJWT } = useRefreshSlice();
  const { connect, isConnecting, error: connectError } = useConnect();
  const [loginStatus, setLoginStatus] = useState<null | LoginStatus>(null);

  const installedWallets = injectedSupportedWalletIds
    .filter((wallet) => injectedProvider(wallet) != null)
    .map((wallet) => createWallet(wallet));

  if (installedWallets.length < 1) {
    console.log("Installed wallets wasn't found");
  }

  const { mutate, error, isPending } = useMutation({
    mutationFn: (wallet: Wallet) =>
      login(wallet, connect, (s) => setLoginStatus(s)),
    onSuccess: () => {
      setHasJWT(true);
    },
  });

  const gotError = error || connectError;

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-1/5 w-full" />
      {isPending || (
        <>
          <h1 className="text-2xl">Connect wallet to login</h1>
          <div className="h-1/5 w-full" />
        </>
      )}
      <div className="text-center space-y-5">
        {(isPending || isConnecting) && <Loader className="h-60" />}
        <div className={cn("flex-col space-y-4", isPending && "hidden")}>
          {installedWallets.map((wallet) => (
            <ExternalWallet key={wallet.id} wallet={wallet} login={mutate} />
          ))}
          <Button
            type="button"
            onClick={() => mutate(createWallet("walletConnect"))}
          >
            {installedWallets.length > 0 ? "Other wallets" : "Connect wallet"}
          </Button>
        </div>
        {!gotError && loginStatus === "connectWallet" && (
          <p>Wallet should pop-up right now</p>
        )}
        {!gotError && loginStatus === "signMessage" && (
          <p>Sign message in your wallet</p>
        )}
        {!gotError && loginStatus === "fetchingJWT" && (
          <p>Acquiring your session token...</p>
        )}
        {gotError && (
          <ErrorMessage
            className="capitalize text-destructive"
            errors={error || connectError}
          />
        )}
      </div>
    </div>
  );
};

type ExternalWalletProps = {
  wallet: Wallet;
  login: (wallet: Wallet) => void;
};

const ExternalWallet: React.FC<ExternalWalletProps> = ({
  wallet,
  login,
}: ExternalWalletProps) => {
  const imageQuery = useWalletImage(wallet.id);
  const infoQuery = useWalletInfo(wallet.id);
  return (
    <div
      className="flex items-center space-x-4 cursor-pointer card border-secondary/40"
      onClick={() => login(wallet)}
    >
      <img
        className="w-16 aspect-square"
        src={imageQuery.data ?? "https://shorturl.at/E7fM6"}
        alt="Wallet logo"
      />
      <p>{infoQuery.data?.name || ""}</p>
    </div>
  );
};
