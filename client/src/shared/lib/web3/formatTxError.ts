type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null;
}

function getStringField(obj: AnyRecord, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

function pickFirstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const v of values) {
    if (v && v.trim().length > 0) return v;
  }
  return;
}

function normalizeMessage(msg: string): string {
  // Common RPC noise: "execution reverted: <reason>".
  const m = msg.replace(/^Error:\s*/i, "").trim();
  return m;
}

function extractRevertReason(msg: string): string | undefined {
  // Examples seen in providers:
  // - "execution reverted: <reason>"
  // - 'Execution Reverted: {"message":"...","data":{"reason":"<reason>"}} ...'
  // - "VM Exception while processing transaction: reverted with reason string '<reason>'"
  // - "... revert <reason>"
  const s = msg;
  const exec = s.match(/execution reverted(?::\s*(.*))?$/i);
  if (exec?.[1]?.trim()) return exec[1].trim();

  const reasonString = s.match(/reverted with reason string ['"]([^'"]+)['"]/i);
  if (reasonString?.[1]?.trim()) return reasonString[1].trim();

  const revert = s.match(/\brevert(?:ed)?(?::|\s)\s*([^\n\r]+)$/i);
  if (revert?.[1]?.trim()) return revert[1].trim();

  return;
}

function extractJsonBlobAfterPrefix(msg: string): unknown | undefined {
  // thirdweb sometimes formats as:
  // "Execution Reverted: { ...json... }\n\ncontract: 0x... \nchainId: 1337"
  const first = msg.indexOf("{");
  if (first === -1) return;

  // If there's metadata after the JSON, trim it out.
  const metaMarkers = ["\n\ncontract:", "\ncontract:", "\n\nchainId:", "\nchainId:"];
  let end = msg.length;
  for (const marker of metaMarkers) {
    const idx = msg.indexOf(marker, first);
    if (idx !== -1) end = Math.min(end, idx);
  }

  const slice = msg.slice(first, end);
  const last = slice.lastIndexOf("}");
  if (last === -1) return;

  const jsonText = slice.slice(0, last + 1);
  try {
    return JSON.parse(jsonText) as unknown;
  } catch {
    return;
  }
}

function extractReasonFromJsonBlob(blob: unknown): string | undefined {
  if (!isRecord(blob)) return;

  const topReason = getStringField(blob, "reason");
  if (topReason?.trim()) return topReason.trim();

  const data = blob.data;
  if (isRecord(data)) {
    const dataReason = getStringField(data, "reason");
    if (dataReason?.trim()) return dataReason.trim();
    const dataMsg = getStringField(data, "message");
    // Some providers set message="revert" and reason separately; message is a fallback only.
    if (dataMsg?.trim() && dataMsg.toLowerCase().includes("revert") === false) {
      return dataMsg.trim();
    }
  }

  return;
}

export function formatTxError(err: unknown): string {
  if (!err) return "Transaction failed";

  const candidates: string[] = [];
  const push = (v?: string) => {
    if (v && v.trim().length > 0) candidates.push(v.trim());
  };

  if (err instanceof Error) {
    push(err.message);
  }

  if (isRecord(err)) {
    push(getStringField(err, "shortMessage"));
    push(getStringField(err, "reason"));
    push(getStringField(err, "message"));

    const raw = err.raw;
    if (raw instanceof Error) push(raw.message);
    if (isRecord(raw)) {
      push(getStringField(raw, "shortMessage"));
      push(getStringField(raw, "reason"));
      push(getStringField(raw, "message"));
      const rawData = raw.data;
      if (isRecord(rawData)) {
        push(getStringField(rawData, "reason"));
        push(getStringField(rawData, "message"));
      }
    }

    const cause = err.cause;
    if (cause instanceof Error) push(cause.message);
    if (isRecord(cause)) {
      push(getStringField(cause, "shortMessage"));
      push(getStringField(cause, "reason"));
      push(getStringField(cause, "message"));
    }

    const data = err.data;
    if (isRecord(data)) {
      push(getStringField(data, "message"));
      push(getStringField(data, "reason"));
    }
  }

  const best = pickFirstNonEmpty(...candidates) ?? "Transaction failed";
  const msg = normalizeMessage(best);

  const lower = msg.toLowerCase();
  if (lower.includes("user rejected") || lower.includes("user denied")) {
    return "Transaction was rejected";
  }
  if (lower.includes("insufficient funds")) {
    return "Insufficient funds to complete transaction";
  }

  const jsonBlob = extractJsonBlobAfterPrefix(msg);
  const reasonFromJson = extractReasonFromJsonBlob(jsonBlob);
  const reason = reasonFromJson ?? extractRevertReason(msg);
  if (reason) {
    return `Transaction reverted: ${reason}`;
  }
  if (lower.includes("revert") || lower.includes("reverted")) {
    return "Transaction reverted by contract";
  }

  // Keep it readable on mobile.
  return msg.length > 180 ? `${msg.slice(0, 180)}...` : msg;
}
