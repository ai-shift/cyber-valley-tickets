import { getAddress, signMessage } from "@/shared/lib/web3";

export const login = async () => {
  const address = await getAddress();
  const message = `Sign this message to authenticate with our service.\n\nAddress: ${address}\nTimestamp: ${new Date().toISOString()}`;
  const signature = await signMessage(message);

  const nonceResponse = await fetch("/api/auth/web3/nonce");
  const { nonce } = await nonceResponse.json();

  const response = await fetch("/api/auth/web3/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address,
      signature,
      message,
      nonce,
    }),
  });

  return response;
};
