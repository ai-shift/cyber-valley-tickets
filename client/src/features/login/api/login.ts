import { client } from "@/shared/lib/web3";
import { signMessage } from "thirdweb/utils";
import type { Wallet } from "thirdweb/wallets";

export const login = async (
  wallet: Wallet,
  connect: (wallet: Wallet) => void,
) => {
  console.log("Logging in wallet", wallet);
  const account = await wallet.connect({ client });
  console.log("Client", client, "account", account);

  const nonceResponse = await fetch("/api/auth/web3/nonce");
  const { nonce } = await nonceResponse.json();
  console.log("Got nonce", nonce);

  const message = `Sign this message to authenticate with our service.\n\nAddress: ${account.address}\nTimestamp: ${new Date().toISOString()}`;
  const signature = await signMessage({ message, account });

  const response = await fetch("/api/auth/web3/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address: account.address,
      signature,
      message,
      nonce,
    }),
  });

  connect(wallet);
  console.log("Wallet connected", wallet, account);
  return response;
};
