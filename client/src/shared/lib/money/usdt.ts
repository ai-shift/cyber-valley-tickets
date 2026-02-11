const USDT_DECIMALS = 6n;
const USDT_SCALE = 10n ** USDT_DECIMALS;

export function parseUsdt(input: string): bigint {
  const s = input.trim();
  if (s.length === 0) throw new Error("Empty amount");
  if (s.startsWith("-")) throw new Error("Negative amount");

  const parts = s.split(".");
  if (parts.length > 2) throw new Error("Invalid amount");

  const wholeStr = parts[0] ?? "";
  const fracStr = parts[1] ?? "";

  if (!/^\d+$/.test(wholeStr)) throw new Error("Invalid amount");
  if (fracStr.length > 0 && !/^\d+$/.test(fracStr))
    throw new Error("Invalid amount");
  if (fracStr.length > 6) throw new Error("Too many decimals");

  const whole = BigInt(wholeStr || "0");
  const frac = BigInt((fracStr + "0".repeat(6)).slice(0, 6) || "0");
  return whole * USDT_SCALE + frac;
}

export function formatUsdt(amount: bigint): string {
  const neg = amount < 0n;
  const v = neg ? -amount : amount;

  const whole = v / USDT_SCALE;
  const frac = v % USDT_SCALE;
  const fracStr = frac.toString().padStart(6, "0").replace(/0+$/, "");
  const out =
    fracStr.length === 0 ? whole.toString() : `${whole.toString()}.${fracStr}`;
  return neg ? `-${out}` : out;
}

export function usdtUnits(amount: string | number | bigint): bigint {
  if (typeof amount === "bigint") return amount;
  if (typeof amount === "number") {
    if (!Number.isFinite(amount)) throw new Error("Invalid amount");
    // Only accept integers here to avoid float money.
    if (!Number.isInteger(amount)) throw new Error("Non-integer number amount");
    return BigInt(amount);
  }
  // Human-readable decimal string like "10.5"
  return parseUsdt(amount);
}
