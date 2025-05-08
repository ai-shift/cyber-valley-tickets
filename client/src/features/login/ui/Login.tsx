import { useRefreshSlice } from "@/app/providers";
import { cn } from "@/shared/lib/utils";
import { wallets } from "@/shared/lib/web3";
import { ErrorMessage } from "@/shared/ui/ErrorMessage";
import { Loader } from "@/shared/ui/Loader";
import { useMutation } from "@tanstack/react-query";
import { useConnect, useWalletImage, useWalletInfo } from "thirdweb/react";
import type { Wallet } from "thirdweb/wallets";
import { login } from "../api/login";

export const Login: React.FC = () => {
  const { setHasJWT } = useRefreshSlice();
  const { connect, isConnecting, error: connectError } = useConnect();
  const { mutate, error, isPending } = useMutation({
    mutationFn: (wallet: Wallet) => login(wallet, connect),
    onSuccess: () => {
      setHasJWT(true);
    },
  });

  return (
    <div className="flex flex-col h-full justify-center items-center">
      <h1 className="text-2xl mb-8">
        {isPending || "Connect wallet to login"}
      </h1>
      <div className="text-center space-y-5">
        {(isPending || isConnecting) && <Loader className="h-60" />}
        <div className={cn("flex-col space-y-4", isPending && "hidden")}>
          {wallets.map((wallet) => (
            <ExternalWallet key={wallet.id} wallet={wallet} login={mutate} />
          ))}
        </div>
        {(error || connectError) && (
          <ErrorMessage
            className="capitalize text-destructive"
            errors={error}
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
