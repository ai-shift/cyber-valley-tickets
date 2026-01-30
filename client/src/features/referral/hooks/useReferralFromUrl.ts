import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { isValidEthereumAddress, saveReferral } from "../lib/storage";

export function useReferralFromUrl(): string | null {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");

  useEffect(() => {
    if (ref && isValidEthereumAddress(ref)) {
      saveReferral(ref);
    }
  }, [ref]);

  return ref && isValidEthereumAddress(ref) ? ref.toLowerCase() : null;
}
