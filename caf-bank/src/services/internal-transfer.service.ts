import mongoose from "mongoose";
import { z } from "zod";
import { Account, AuditLog, LedgerEntry, Receipt, Transaction, User } from "@/lib/models";
import { AppError } from "@/lib/http";
import { uniqueReference } from "./identifier.service";
import { broadcastNotification, queueNotification } from "./notification.service";
import { deliverEmailJob } from "@/lib/email/send-email";

const inputSchema = z.object({ sourceAccountId: z.string(), destinationAccountId: z.string(), amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/), idempotencyKey: z.string().uuid() }).strict();

export function quoteInternalTransfer(sourceCurrency: string, destinationCurrency: string, amount: number) {
  const rate = Number(process.env.USD_GBP_RATE);
  if (!Number.isFinite(rate) || rate <= 0) throw new AppError("Internal conversion rate is unavailable.", 503);
  const conversion = sourceCurrency === "USD" && destinationCurrency === "GBP" ? rate : sourceCurrency === "GBP" && destinationCurrency === "USD" ? 1 / rate : 0;
  if (!conversion) throw new AppError("Unsupported account conversion.", 422);
  const fee = 0;
  return { rate: conversion, fee, creditedAmount: Math.round(amount * conversion), sourceCurrency, destinationCurrency };
}

export async function internalTransfer(userId: string, input: unknown) {
  const data = inputSchema.parse(input);
  if (data.sourceAccountId === data.destinationAccountId || !mongoose.isValidObjectId(data.sourceAccountId) || !mongoose.isValidObjectId(data.destinationAccountId)) throw new AppError("Select two valid accounts.", 422);
  const amount = Math.round(Number(data.amount) * 100);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new AppError("Enter a positive amount.", 422);
  const existing = await Transaction.findOne({ userId, idempotencyKey: data.idempotencyKey });
  if (existing) return existing;
  const user = await User.findById(userId);
  if (!user?.emailVerified || !user.identityVerified) throw new AppError("Complete verification first.", 403);
  const session = await mongoose.startSession();
  let transactionId: string | undefined, jobId: string | undefined;
  try {
    await session.withTransaction(async () => {
      const source = await Account.findOne({ _id: data.sourceAccountId, userId, status: "ACTIVE" }).session(session);
      const destination = await Account.findOne({ _id: data.destinationAccountId, userId, status: "ACTIVE" }).session(session);
      if (!source || !destination || source.name === destination.name) throw new AppError("Both active accounts must belong to you.", 422);
      const quote = quoteInternalTransfer(source.currency, destination.currency, amount);
      if (quote.creditedAmount <= 0) throw new AppError("Amount is too small for conversion.", 422);
      const debit = await Account.updateOne({ _id: source._id, userId, availableBalance: { $gte: amount + quote.fee } }, { $inc: { availableBalance: -(amount + quote.fee), ledgerBalance: -(amount + quote.fee) } }, { session });
      if (!debit.modifiedCount) throw new AppError("Your account does not have sufficient available funds.", 422);
      await Account.updateOne({ _id: destination._id, userId }, { $inc: { availableBalance: quote.creditedAmount, ledgerBalance: quote.creditedAmount } }, { session });
      const reference = await uniqueReference("TXN");
      const [transaction] = await Transaction.create([{ userId, accountId: source._id, destinationAccountId: destination._id, recipientName: destination.name, amount, creditedAmount: quote.creditedAmount, currency: source.currency, destinationCurrency: destination.currency, exchangeRate: quote.rate, feeType: "NONE", feeAmount: quote.fee, feeDescription: "No fee", type: "INTERNAL_TRANSFER", idempotencyKey: data.idempotencyKey, reference, description: `${source.name} to ${destination.name}`, status: "COMPLETED", completedAt: new Date(), completionNotifiedAt: new Date(), statusHistory: [{ status: "INITIATED", changedAt: new Date(), changedBy: userId, note: "Transfer submitted" }, { status: "PROCESSING", changedAt: new Date(), changedBy: userId, note: "Balances being posted" }, { status: "COMPLETED", changedAt: new Date(), changedBy: userId, note: "Balances posted" }] }], { session, ordered: true });
      transactionId = String(transaction._id);
      await LedgerEntry.create([
        { userId, accountId: source._id, transactionId: transaction._id, transactionReference: reference, accountType: source.name, operationKey: `INTERNAL_DEBIT:${transaction._id}`, type: "DEBIT", amount: -amount, currency: source.currency, balanceBefore: source.availableBalance, balanceAfter: source.availableBalance - amount, description: transaction.description, status: "COMPLETED" },
        { userId, accountId: destination._id, transactionId: transaction._id, transactionReference: reference, accountType: destination.name, operationKey: `INTERNAL_CREDIT:${transaction._id}`, type: "CREDIT", amount: quote.creditedAmount, currency: destination.currency, balanceBefore: destination.availableBalance, balanceAfter: destination.availableBalance + quote.creditedAmount, description: transaction.description, status: "COMPLETED" },
      ], { session, ordered: true });
      await Receipt.create([{ transactionId: transaction._id, userId, number: await uniqueReference("RCT"), status: "COMPLETED", issuedAt: new Date() }], { session, ordered: true });
      await AuditLog.create([{ actorId: userId, action: "INTERNAL_TRANSFER_COMPLETED", entityId: transaction._id, metadata: { reference } }], { session, ordered: true });
      const notice = await queueNotification({ userId, type: "TRANSACTION_COMPLETED", subject: "Internal transfer completed", body: `Reference: ${reference}\nDebited: ${(amount / 100).toFixed(2)} ${source.currency}\nCredited: ${(quote.creditedAmount / 100).toFixed(2)} ${destination.currency}\nStatus: COMPLETED`, href: `/dashboard/transactions/${transaction._id}`, eventKey: `INTERNAL_COMPLETED:${transaction._id}`, details: { transactionId: transactionId!, reference, status: "COMPLETED" } }, session);
      jobId = notice.jobId;
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      const duplicate = await Transaction.findOne({ userId, idempotencyKey: data.idempotencyKey });
      if (duplicate) return duplicate;
    }
    throw error;
  } finally { await session.endSession(); }
  broadcastNotification(userId);
  if (jobId) { try { await deliverEmailJob(jobId); } catch { /* Queued for retry. */ } }
  return Transaction.findById(transactionId);
}
