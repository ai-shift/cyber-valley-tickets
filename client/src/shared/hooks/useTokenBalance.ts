import { erc20 } from "@/shared/lib/web3";
import { useQuery } from "@tanstack/react-query";
import { balanceOf } from "thirdweb/extensions/erc20";
import { useActiveAccount } from "thirdweb/react";

export const useTokenBalance = () => {
  const account = useActiveAccount();

  return useQuery({
    queryKey: ["tokenBalance", account?.address],
    queryFn: async () => {
      if (!account) return null;

      const balance = await balanceOf({
        contract: erc20,
        address: account.address,
      });

      return balance;
    },
    enabled: !!account,
    staleTime: 30000,
    refetchInterval: 30000,
  });
};
