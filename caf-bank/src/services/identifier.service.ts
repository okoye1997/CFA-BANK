import { Account, Receipt, Transaction } from "@/lib/models";
import { newAccountNumber, newReference } from "@/lib/identifiers";

export async function uniqueAccountNumber() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const number = newAccountNumber();
    if (!await Account.exists({ accountNumber: number })) return number;
  }
  throw new Error("Unable to allocate account number.");
}

export async function uniqueReference(prefix: "TXN" | "RCT") {
  const model = prefix === "TXN" ? Transaction : Receipt;
  for (let attempt = 0; attempt < 10; attempt++) {
    const value = newReference(prefix);
    if (!await model.exists(prefix === "TXN" ? { reference: value } : { number: value })) return value;
  }
  throw new Error("Unable to allocate reference.");
}

export async function createNumberedAccount(userId: string, name: "Cash Account" | "Gold Account", currency: "USD" | "GBP") {
  for (let attempt = 0; attempt < 10; attempt++) {
    try { return await Account.create({ userId, accountNumber: await uniqueAccountNumber(), name, currency, availableBalance: 0, ledgerBalance: 0 }); }
    catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
  }
  throw new Error("Unable to allocate account number.");
}
