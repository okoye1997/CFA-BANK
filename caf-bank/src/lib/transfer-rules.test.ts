import { describe, expect, it } from "vitest";
import { validateCashTransferAmount } from "./transfer-rules";
describe("Cash Account transfer limits", () => {
  it("accepts both exact boundaries", () => {
    expect(validateCashTransferAmount("300000.00")).toBe(30_000_000);
    expect(validateCashTransferAmount("9990000.00")).toBe(999_000_000);
  });
  it("returns the specified errors immediately outside the boundaries", () => {
    expect(() => validateCashTransferAmount("299999.99")).toThrow("The minimum transfer amount is $300,000.00.");
    expect(() => validateCashTransferAmount("9990000.01")).toThrow("The maximum transfer amount is $9,990,000.00.");
  });
});
