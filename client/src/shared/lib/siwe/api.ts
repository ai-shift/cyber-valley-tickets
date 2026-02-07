type SiwePurpose = "ticket_qr" | "staff_verify";

export type SiwePayload = {
  address: string;
  chain_id: string;
  domain: string;
  expiration_time: string;
  invalid_before: string;
  issued_at: string;
  nonce: string;
  resources: string[];
  statement: string;
  uri: string;
  version: string;
};

export type SiwePayloadResponse = {
  payload: SiwePayload;
  message: string;
};

export type SiweVerifyResponse = {
  proof_token: string;
  address: string;
  expires_at: number;
};

export async function fetchSiwePayload(opts: {
  address: string;
  purpose: SiwePurpose;
}): Promise<SiwePayloadResponse> {
  const url = new URL("/api/siwe/payload", import.meta.env.PUBLIC_API_HOST);
  const resp = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!resp.ok) {
    throw new Error(`SIWE payload failed: HTTP ${resp.status}`);
  }
  return (await resp.json()) as SiwePayloadResponse;
}

export async function fetchSiweVerify(opts: {
  payload: SiwePayload;
  signature: string;
}): Promise<SiweVerifyResponse> {
  const url = new URL("/api/siwe/verify", import.meta.env.PUBLIC_API_HOST);
  const resp = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!resp.ok) {
    throw new Error(`SIWE verify failed: HTTP ${resp.status}`);
  }
  return (await resp.json()) as SiweVerifyResponse;
}

