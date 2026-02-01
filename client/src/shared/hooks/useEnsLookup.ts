import { createThirdwebClient } from "thirdweb";
import { useEnsName } from "thirdweb/react";

const client = createThirdwebClient({
  clientId: import.meta.env.PUBLIC_THIRDWEB_PUBLIC_CLIENT_ID,
});

export const useEnsLookup = (address?: string) => {
  const { data } = useEnsName({ client, address });

  return data;
};
