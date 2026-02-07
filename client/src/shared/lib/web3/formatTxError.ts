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

  const reason = extractRevertReason(msg);
  if (reason) {
    return `Transaction reverted: ${reason}`;
  }
  if (lower.includes("revert") || lower.includes("reverted")) {
    return "Transaction reverted by contract";
  }

  // Keep it readable on mobile.
  return msg.length > 180 ? `${msg.slice(0, 180)}...` : msg;
}

