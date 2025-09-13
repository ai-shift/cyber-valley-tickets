import { useActiveAccount } from "thirdweb/react";

export const InAppWalletDemo: React.FC = () => {
  const account = useActiveAccount();

  if (account) {
    return null;
  }

  return null;
};
