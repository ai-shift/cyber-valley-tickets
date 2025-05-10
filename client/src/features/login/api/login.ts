import { client } from "@/shared/lib/web3";
import { type Account, type Wallet, injectedProvider } from "thirdweb/wallets";

export const login = async (
  wallet: Wallet,
  connect: (wallet: Wallet) => void,
) => {
  let account: Account;
  if (injectedProvider(wallet.id)) {
    account = await wallet.connect({ client });
  } else {
    console.warn("Provider is not injected");
    account = await wallet.connect({
      client,
      walletConnect: { showQrModal: true },
    });
  }
  console.log("Client", client, "account", account);
  const nonceResponse = await fetch("/api/auth/web3/nonce");
  const { nonce } = await nonceResponse.json();

  const message = `Sign this message to authenticate with our service.\n\nAddress: ${account.address}\nTimestamp: ${new Date().toISOString()}`;
  const signature = await account.signMessage({ message });

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
