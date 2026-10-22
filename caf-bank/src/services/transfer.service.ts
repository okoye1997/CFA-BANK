import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomInt, randomUUID } from "crypto";
import { Account, AdminTransactionChallenge, AuditLog, Beneficiary, LedgerEntry, Transaction, TransactionAuthorization, User } from "@/lib/models";
import { AppError } from "@/lib/http";
import { formatMoney } from "@/lib/money";
import { validateCashTransferAmount, validateCashTransferMinor } from "@/lib/transfer-rules";
import { transferSchema, pinSchema } from "@/lib/validation";
import { deliverEmailJob, sendSecretCodeEmail } from "@/lib/email/send-email";
import { audit } from "./audit.service";
import { broadcastNotification, queueNotification } from "./notification.service";

export async function setTransactionPin(userId: string, pin: string) {
  pinSchema.parse(pin);
  const user = await User.findById(userId);
  if (user.transactionPinHash) throw new AppError("Transaction PIN already set.", 409);
  user.transactionPinHash = await bcrypt.hash(pin, 12); await user.save();
  await audit("TRANSACTION_PIN_CREATED", userId);
}
export async function createTransfer(userId: string, input: unknown) {
  const data = transferSchema.parse(input), amount = validateCashTransferAmount(data.amount);
  const user = await User.findById(userId);
  if (!user.emailVerified || !user.identityVerified) throw new AppError("Complete verification first.", 403);
  const account = await Account.findOne({ _id: data.accountId, userId, name: "Cash Account", status: "ACTIVE" });
  if (!account) throw new AppError("Active Cash Account required.", 403);
  if (account.availableBalance < amount) throw new AppError("Insufficient available balance.", 422);
  const beneficiary = await Beneficiary.findOne({ _id: data.beneficiaryId, userId });
  if (!beneficiary) throw new AppError("Select your beneficiary.", 403);
  const transaction = await Transaction.create({ userId, accountId: account._id, beneficiaryId: beneficiary._id, amount, currency: "USD", reference: `CAF-${randomUUID().slice(0, 12).toUpperCase()}`, description: data.description, status: "AWAITING_TRANSACTION_PIN" });
  await audit("TRANSACTION_CREATION", userId, String(transaction._id));
  return transaction;
}
export async function authorizeCustomer(userId: string, transactionId: string, pin: string) {
  const adminEmail = process.env.ADMIN_APPROVAL_EMAIL;
  if (!adminEmail || !process.env.SMTP_HOST) throw new AppError("Admin authorization channel is not configured.", 503);
  const user = await User.findById(userId);
  if (!user.transactionPinHash) throw new AppError("Create a transaction PIN in Settings first.", 409);
  if (user.pinLockedUntil && user.pinLockedUntil > new Date()) throw new AppError("Too many attempts. Try again later.", 429);
  if (!await bcrypt.compare(pin, user.transactionPinHash)) {
    user.pinFailures++;
    if (user.pinFailures >= 5) { user.pinLockedUntil = new Date(Date.now() + 15 * 60_000); user.pinFailures = 0; }
    await user.save(); await audit("TRANSACTION_PIN_FAILURE", userId, transactionId);
    throw new AppError("Incorrect transaction PIN.", 403);
  }
  user.pinFailures = 0; user.pinLockedUntil = undefined; await user.save();
  const transaction = await Transaction.findOneAndUpdate({ _id: transactionId, userId, status: "AWAITING_TRANSACTION_PIN" }, { $set: { status: "AWAITING_ADMIN_AUTHORIZATION" } }, { returnDocument: "after" });
  if (!transaction) throw new AppError("Transaction is not awaiting PIN authorization.", 409);
  await TransactionAuthorization.updateOne({ transactionId }, { $set: { customerAuthorizedAt: new Date() } }, { upsert: true });
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const challenge = await AdminTransactionChallenge.create({ transactionId, codeHash: await bcrypt.hash(code, 12), expiresAt: new Date(Date.now() + 10 * 60_000) });
  try { await sendSecretCodeEmail({ to: adminEmail, subject: "CAF Bank admin transaction authorization", customerName: "Administrator", message: `Transaction ${transaction.reference} for ${formatMoney(transaction.amount, "USD")} is awaiting authorization. The single-use code is ${code}. It expires in 10 minutes.`, safeMessage: `Transaction ${transaction.reference} is awaiting authorization. Its one-time code is not stored in this email job.` }); }
  catch (error) {
    await AdminTransactionChallenge.deleteOne({ _id: challenge._id });
    await TransactionAuthorization.deleteOne({ transactionId });
    await Transaction.updateOne({ _id: transactionId, status: "AWAITING_ADMIN_AUTHORIZATION" }, { $set: { status: "AWAITING_TRANSACTION_PIN" } });
    throw error;
  }
  await audit("TRANSACTION_PIN_SUCCESS", userId, transactionId);
  return transaction;
}
export async function authorizeAdmin(adminId: string, transactionId: string, code: string) {
  const challenge = await AdminTransactionChallenge.findOne({ transactionId, usedAt: null }).sort({ createdAt: -1 });
  if (!challenge || challenge.expiresAt < new Date() || challenge.attemptCount >= 5) throw new AppError("Authorization code expired or attempts exhausted.", 429);
  challenge.attemptCount++;
  if (!/^\d{6}$/.test(code) || !await bcrypt.compare(code, challenge.codeHash)) { await challenge.save(); throw new AppError("Invalid authorization code.", 403); }
  const transaction = await Transaction.findOne({ _id: transactionId, status: "AWAITING_ADMIN_AUTHORIZATION" });
  const authorization = await TransactionAuthorization.findOne({ transactionId, customerAuthorizedAt: { $exists: true } });
  if (!transaction || !authorization) throw new AppError("Transaction is not awaiting authorization.", 409);
  validateCashTransferMinor(transaction.amount);
  const session = await mongoose.startSession();
  let confirmationJobId: string | undefined;
  try {
    await session.withTransaction(async () => {
      const current = await Transaction.findOne({ _id: transactionId, status: "AWAITING_ADMIN_AUTHORIZATION" }).session(session);
      if (!current) throw new AppError("Transaction already processed.", 409);
      const customer = await User.findById(current.userId).session(session);
      if (!customer?.identityVerified || !customer.emailVerified) throw new AppError("Customer verification required.", 403);
      const account = await Account.findOne({ _id: current.accountId, userId: current.userId, status: "ACTIVE", availableBalance: { $gte: current.amount } }).session(session);
      if (!account) throw new AppError("Insufficient available balance.", 422);
      if (!await Beneficiary.exists({ _id: current.beneficiaryId, userId: current.userId }).session(session)) throw new AppError("Recipient is no longer available.", 422);
      await LedgerEntry.create([{ userId: current.userId, accountId: account._id, transactionId: current._id, operationKey: `TRANSFER_DEBIT:${transactionId}`, type: "TRANSFER_DEBIT", amount: -current.amount, status: "COMPLETED" }], { session, ordered: true });
      await Account.updateOne({ _id: account._id }, { $inc: { availableBalance: -current.amount, ledgerBalance: -current.amount } }, { session });
      await Transaction.updateOne({ _id: current._id }, { $set: { status: "PENDING", pendingAt: new Date() } }, { session });
      await TransactionAuthorization.updateOne({ transactionId }, { $set: { adminAuthorizedAt: new Date() } }, { session });
      await AdminTransactionChallenge.updateOne({ _id: challenge._id, usedAt: null }, { $set: { usedAt: new Date() } }, { session });
      const body = `Your transaction has been accepted and is currently pending processing.\nAmount: ${formatMoney(current.amount, "USD")}\nReference: ${current.reference}\nDate: ${new Date().toISOString()}\nStatus: Pending`;
      await AuditLog.create([{ actorId: adminId, action: "ADMIN_TRANSACTION_AUTHORIZATION", entityId: current._id }, { actorId: adminId, action: "LEDGER_DEBIT", entityId: current._id }], { session, ordered: true });
      const notice = await queueNotification({ userId: String(current.userId), type: "TRANSFER", subject: "Transaction confirmed", body, href: "/dashboard/transactions" }, session);
      confirmationJobId = notice.jobId;
    });
  } finally { await session.endSession(); }
  broadcastNotification(String(transaction.userId));
  if (confirmationJobId) { try { await deliverEmailJob(confirmationJobId); } catch { /* queued job can be retried */ } }
  return { status: "PENDING" };
}
