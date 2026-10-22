import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountCards } from "./account-cards";
describe("account balance visibility", () => {
  it("hides and restores both balances on customer request", async () => {
    const user = userEvent.setup();
    render(<AccountCards accounts={[{ _id: "cash", name: "Cash Account", currency: "USD", availableBalance: 1_000_000_000, ledgerBalance: 1_000_000_000, status: "ACTIVE" }, { _id: "gold", name: "Gold Account", currency: "GBP", availableBalance: 0, ledgerBalance: 0, status: "ACTIVE" }]}/>);
    expect(screen.getAllByText("$10,000,000.00")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: /hide balances/i }));
    expect(screen.queryByText("$10,000,000.00")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show balances/i }));
    expect(screen.getAllByText("$10,000,000.00")).toHaveLength(2);
  });
});
