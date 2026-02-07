type SiwePurpose = "ticket_qr" | "staff_verify";

type StoredProof = {
  token: string;
  expiresAt: number;
};

const storageKey = (address: string, purpose: SiwePurpose) =>
  `siwe_proof:${purpose}:${address.toLowerCase()}`;

export function getStoredProof(
  address: string,
  purpose: SiwePurpose,
): StoredProof | null {
  try {
    const raw = localStorage.getItem(storageKey(address, purpose));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredProof;
    if (
      !parsed ||
      typeof parsed.token !== "string" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }
    if (Date.now() / 1000 >= parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredProof(
  address: string,
  purpose: SiwePurpose,
  proof: StoredProof,
): void {
  localStorage.setItem(storageKey(address, purpose), JSON.stringify(proof));
}

export function clearStoredProof(address: string, purpose: SiwePurpose): void {
  localStorage.removeItem(storageKey(address, purpose));
}

