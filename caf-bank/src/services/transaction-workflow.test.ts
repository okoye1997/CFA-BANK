import { describe, expect, it } from "vitest";
import { adminTransitions } from "./transaction-workflow.service";
import { quoteInternalTransfer } from "./internal-transfer.service";

describe("transaction workflow", () => {
  it("permits review, approval and completion in order", () => {
    expect(adminTransitions.PENDING).toContain("UNDER_REVIEW");
    expect(adminTransitions.UNDER_REVIEW).toContain("AWAITING_ADMIN_APPROVAL");
    expect(adminTransitions.AWAITING_ADMIN_APPROVAL).toContain("APPROVED");
    expect(adminTransitions.APPROVED).toContain("PROCESSING");
    expect(adminTransitions.PROCESSING).toContain("COMPLETED");
    expect(adminTransitions.COMPLETED).toBeUndefined();
    expect(adminTransitions.DECLINED).toBeUndefined();
    expect(adminTransitions.AWAITING_ADMIN_AUTHORIZATION).toBeUndefined();
  });
  it("quotes both Cash and Gold directions from the backend rate", () => {
    process.env.USD_GBP_RATE = "0.8";
    expect(quoteInternalTransfer("USD", "GBP", 10000).creditedAmount).toBe(8000);
    expect(quoteInternalTransfer("GBP", "USD", 8000).creditedAmount).toBe(10000);
    expect(quoteInternalTransfer("USD", "GBP", 10000).fee).toBe(0);
    delete process.env.USD_GBP_RATE;
  });
});
