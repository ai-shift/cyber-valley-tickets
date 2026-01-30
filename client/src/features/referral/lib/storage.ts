const REFERRAL_LOCAL_KEY = "cyber_valley_referral";

export interface ReferralData {
  address: string;
  timestamp: number;
}

export function isValidEthereumAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false;

  // Check basic format: 0x followed by 40 hex characters
  const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!ethereumAddressRegex.test(address)) return false;

  // Additional checksum validation could be added here if needed
  // For now, basic format validation is sufficient
  return true;
}

export function saveReferral(address: string): void {
  if (!isValidEthereumAddress(address)) {
    console.warn("Invalid referral address:", address);
    return;
  }

  const now = Date.now();
  const referralData: ReferralData = {
    address: address.toLowerCase(),
    timestamp: now,
  };

  localStorage.setItem(REFERRAL_LOCAL_KEY, JSON.stringify(referralData));
}

export function getReferral(): ReferralData | null {
  const stored = localStorage.getItem(REFERRAL_LOCAL_KEY);
  if (!stored) return null;

  try {
    const data: ReferralData = JSON.parse(stored);

    return data;
  } catch {
    localStorage.removeItem(REFERRAL_LOCAL_KEY);
    return null;
  }
}

export function clearReferral(): void {
  localStorage.removeItem(REFERRAL_LOCAL_KEY);
}

export function getReferralAddress(): string | null {
  const referral = getReferral();
  return referral?.address || null;
}
