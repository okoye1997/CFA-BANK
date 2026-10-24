import { randomBytes } from "node:crypto";

export function newReference(prefix: "TXN" | "RCT") {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${prefix}-${date}-${randomBytes(8).toString("hex").toUpperCase()}`;
}

export function newAccountNumber() {
  // 16 random decimal digits, independent of MongoDB identifiers.
  const bytes = randomBytes(16);
  return Array.from(bytes, byte => String(byte % 10)).join("");
}

export function maskedAccount(number?: string) {
  return number ? `${"*".repeat(Math.max(0, number.length - 4))}${number.slice(-4)}` : "Unavailable";
}
