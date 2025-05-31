import { useCallback, useMemo, useState } from "react";
import { useActiveWallet, useWalletInfo } from "thirdweb/react";

export type UseSendTxReturn<T> = {
  sendTx: (promise: Promise<T>) => Promise<T>;
  error: Error | null;
  isLoading: boolean;
};

export const useSendTx = <T>(): UseSendTxReturn<T> => {
  const wallet = useActiveWallet();
  const { data: walletInfo } = useWalletInfo(wallet?.id);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isMobile = useMemo(() => {
    return /Mobi|Android/i.test(navigator.userAgent);
  }, []);

  const sendTx = useCallback(
    async (promise: Promise<T>): Promise<T> => {
      console.log("Submitting transaction", walletInfo, wallet);
      setError(null);
      setIsLoading(true);

      if (wallet == null) {
        throw new Error("Wallet should be connected");
      }

      const account = await wallet.getAccount();
      if (account == null) {
        throw new Error("Account should be connected");
      }

      try {
        if (isMobile && walletInfo != null) {
          if (wallet.id === "walletConnect") {
            window.location.href = "wc://";
          } else {
            if (walletInfo.mobile.universal == null) {
              console.warn(
                "Deep link wasn't found for wallet",
                wallet,
                "with info",
                walletInfo,
              );
            } else {
              window.location.href = walletInfo.mobile.universal;
            }
          }
        }

        console.log("Waiting for Tx");
        const result = await promise;
        setIsLoading(false);
        return result;
      } catch (err) {
        console.error("Transaction failed:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
        throw err;
      }
    },
    [wallet, walletInfo, isMobile],
  );

  return { sendTx, error, isLoading };
};
