import { useCallback, useEffect, useState } from "react";
import {
  type ReferralData,
  clearReferral,
  getReferral,
  isValidEthereumAddress,
  saveReferral,
} from "../lib/storage";

interface UseReferralStorageReturn {
  referral: ReferralData | null;
  address: string | null;
  setReferral: (address: string) => void;
  clearReferral: () => void;
  isValid: (address: string) => boolean;
}

export function useReferralStorage(): UseReferralStorageReturn {
  const [referral, setReferralState] = useState<ReferralData | null>(null);

  useEffect(() => {
    // Load initial referral from storage
    const stored = getReferral();
    setReferralState(stored);
  }, []);

  const setReferral = useCallback((address: string) => {
    if (isValidEthereumAddress(address)) {
      saveReferral(address);
      setReferralState(getReferral());
    }
  }, []);

  const clearReferralCallback = useCallback(() => {
    clearReferral();
    setReferralState(null);
  }, []);

  return {
    referral,
    address: referral?.address || null,
    setReferral,
    clearReferral: clearReferralCallback,
    isValid: isValidEthereumAddress,
  };
}
