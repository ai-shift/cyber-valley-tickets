// thirdweb supports a default WalletConnect projectId, but providing your own is recommended.
// Keep this object stable and always defined to avoid passing `undefined` into thirdweb modal props.
export const walletConnectConfig: { projectId?: string } = (() => {
  const projectId = import.meta.env.PUBLIC_WALLETCONNECT_PROJECT_ID as
    | string
    | undefined;

  if (!projectId && import.meta.env.DEV) {
    console.warn(
      "PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Using thirdweb default WalletConnect projectId.",
    );
  }

  return projectId ? { projectId } : {};
})();
