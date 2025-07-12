import { useCallback, useState } from "react";
import { useActiveWallet } from "thirdweb/react";

export type SendTx<T> = (promise: Promise<T>) => Promise<T>;

export type UseSendTxReturn<T> = {
  sendTx: SendTx<T>;
  data: T | null;
  error: Error | null;
  isLoading: boolean;
};

// NOTE: This wrapper doesn't make any sense now, but it was written initially
// to provide deep linking to the wallet apps on the mobile
// Later deep linking started working without it
// because of integration of `useConnectModal` from thirdweb
// i.e another undocumented hidden magical side effect of a shitty lib
//
// NOTE: It can be replaced with `useSendTransaction` from thirdweb,
// but good luck to fight yelling typescript
export const useSendTx = <T>(): UseSendTxReturn<T> => {
  const wallet = useActiveWallet();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<T | null>(null);

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
        setData(result);
        setIsLoading(false);
        return result;
      } catch (err) {
        console.error("Transaction failed:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
        throw err;
      }
    },
    [wallet],
  );

  return { sendTx, error, data, isLoading };
};
