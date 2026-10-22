import { AppError } from "./http";
import { parseMoney } from "./money";
export const CASH_TRANSFER_MIN = 30_000_000;
export const CASH_TRANSFER_MAX = 999_000_000;
export function validateCashTransferAmount(input: string) {
  return validateCashTransferMinor(parseMoney(input));
}
export function validateCashTransferMinor(amount: number) {
  if (!Number.isSafeInteger(amount)) throw new AppError("Invalid transfer amount.", 422);
  if (amount < CASH_TRANSFER_MIN) throw new AppError("The minimum transfer amount is $300,000.00.", 422);
  if (amount > CASH_TRANSFER_MAX) throw new AppError("The maximum transfer amount is $9,990,000.00.", 422);
  return amount;
}
