import { useCallback, useMemo, useState } from "react";
import { useActiveWallet, useWalletInfo } from "thirdweb/react";

export type SendTx<T> = (promise: Promise<T>) => Promise<T>;

export type UseSendTxReturn<T> = {
  sendTx: SendTx<T>;
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
      console.log("Submitting transaction");
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
        console.log("Waiting for Tx");
        const result = await promise;
        console.log("Tx finished");
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
