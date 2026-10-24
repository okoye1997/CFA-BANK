import { describe, expect, it } from "vitest";
import { maskedAccount, newAccountNumber, newReference } from "./identifiers";

describe("public banking identifiers", () => {
  it("generates distinct transaction and receipt numbers", () => {
    const transactions = new Set(Array.from({ length: 500 }, () => newReference("TXN")));
    const receipts = new Set(Array.from({ length: 500 }, () => newReference("RCT")));
    expect(transactions.size).toBe(500);
    expect(receipts.size).toBe(500);
    expect([...transactions][0]).toMatch(/^TXN-\d{8}-[A-F0-9]{16}$/);
    expect([...receipts][0]).toMatch(/^RCT-\d{8}-[A-F0-9]{16}$/);
  });
  it("generates account numbers independently and masks them", () => {
    const numbers = new Set(Array.from({ length: 500 }, newAccountNumber));
    expect(numbers.size).toBe(500);
    expect([...numbers][0]).toMatch(/^\d{16}$/);
    expect(maskedAccount("1234567890124821")).toBe("************4821");
  });
});
