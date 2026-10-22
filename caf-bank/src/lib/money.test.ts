import { describe, expect, it } from "vitest";
import { addMoney, compareMoney, formatMoney, parseMoney, subtractMoney } from "./money";
describe("minor-unit money", () => {
  it("parses decimal strings exactly", () => { expect(parseMoney("300000.00")).toBe(30_000_000); expect(parseMoney("9990000.00")).toBe(999_000_000); expect(parseMoney("0.01")).toBe(1); });
  it("rejects ambiguous or unsafe amounts", () => { for (const value of ["0.001", "1e3", "-1", "1,000", "90071992547410"]) expect(() => parseMoney(value)).toThrow(); });
  it("adds, subtracts, compares and formats minor units", () => { expect(addMoney(101, 2)).toBe(103); expect(subtractMoney(101, 2)).toBe(99); expect(compareMoney(100, 101)).toBe(-1); expect(formatMoney(100, "USD")).toBe("$1.00"); });
});
