export function parseMoney(input: string): number {
  if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(input)) throw new Error("Enter a valid amount with at most two decimals.");
  const [whole, fraction = ""] = input.split(".");
  const cents = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Amount is too large.");
  return Number(cents);
}

export function addMoney(a: number, b: number) {
  assertMoney(a); assertMoney(b);
  const result = a + b;
  assertMoney(result);
  return result;
}
export function subtractMoney(a: number, b: number) { return addMoney(a, -b); }
export function compareMoney(a: number, b: number) { assertMoney(a); assertMoney(b); return Math.sign(a - b); }
export function formatMoney(cents: number, currency: "USD" | "GBP", locale = "en") {
  assertMoney(cents);
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}
function assertMoney(value: number) {
  if (!Number.isSafeInteger(value)) throw new Error("Invalid minor-unit amount.");
}
