import { createThirdwebClient } from "thirdweb";
import { useActiveAccount, useEnsName } from "thirdweb/react";

const client = createThirdwebClient({
  clientId: import.meta.env.PUBLIC_THIRDWEB_PUBLIC_CLIENT_ID,
});

export const useEnsLookup = () => {
  const account = useActiveAccount();
  console.log("Current account", account);

  const { data } = useEnsName({client, address: account?.address})
  console.log("Data", data)

  return data;
}
