import mongoose from "mongoose";
import { Account, AuditLog, LedgerEntry, Receipt, Transaction } from "@/lib/models";
import { AppError } from "@/lib/http";
import { uniqueReference } from "./identifier.service";
import { broadcastNotification, queueNotification } from "./notification.service";
import { deliverEmailJob } from "@/lib/email/send-email";

export const adminTransitions: Record<string, string[]> = {
  PENDING: ["UNDER_REVIEW", "VERIFICATION_REQUIRED", "DECLINED"],
  VERIFICATION_REQUIRED: ["UNDER_REVIEW", "DECLINED"],
  UNDER_REVIEW: ["AWAITING_ADMIN_APPROVAL", "VERIFICATION_REQUIRED", "DECLINED"],
  AWAITING_ADMIN_APPROVAL: ["APPROVED", "DECLINED"],
  APPROVED: ["PROCESSING"],
  PROCESSING: ["COMPLETED", "FAILED"],
};

const labels: Record<string, string> = {
  UNDER_REVIEW: "Your transaction is under review.", VERIFICATION_REQUIRED: "Additional verification is required.",
  AWAITING_ADMIN_APPROVAL: "Your transaction is awaiting administrative approval.", APPROVED: "Your transaction was approved.",
  PROCESSING: "Your transaction is processing.", COMPLETED: "Your transaction completed successfully.",
  DECLINED: "Your transaction was declined.", FAILED: "Your transaction could not be completed.",
};

export async function changeTransactionStatus(adminId: string, transactionId: string, status: string, note?: string, customerReason?: string) {
  if (!mongoose.isValidObjectId(transactionId)) throw new AppError("Invalid transaction identifier.", 422);
  if (!Object.values(adminTransitions).flat().includes(status)) throw new AppError("Invalid transaction state.", 422);
  if (status === "DECLINED" && (!note?.trim() || !customerReason?.trim())) throw new AppError("A decline reason and customer explanation are required.", 422);
  const session = await mongoose.startSession();
  let jobId: string | undefined, userId: string | undefined;
  try {
    await session.withTransaction(async () => {
      const transaction = await Transaction.findById(transactionId).session(session);
      if (!transaction) throw new AppError("Transaction not found.", 404);
      if (!adminTransitions[transaction.status]?.includes(status)) throw new AppError("Invalid transaction state.", 409);
      const previousStatus = transaction.status;
      if (["DECLINED", "FAILED"].includes(status) && await LedgerEntry.exists({ transactionId: transaction._id, type: "TRANSFER_DEBIT" }).session(session)) {
        const account = await Account.findOne({ _id: transaction.accountId, userId: transaction.userId }).session(session);
        if (!account) throw new AppError("Source account is unavailable for reversal.", 409);
        await LedgerEntry.create([{ userId: transaction.userId, accountId: account._id, transactionId: transaction._id, transactionReference: transaction.reference, accountType: account.name, operationKey: `TRANSFER_REVERSAL:${transactionId}`, type: "REVERSAL", amount: transaction.amount, currency: transaction.currency, balanceBefore: account.availableBalance, balanceAfter: account.availableBalance + transaction.amount, description: `${status} transfer reversal`, status: "COMPLETED" }], { session, ordered: true });
        await Account.updateOne({ _id: account._id }, { $inc: { availableBalance: transaction.amount, ledgerBalance: transaction.amount } }, { session });
      }
      // External transfers are debited by the existing authorization flow. Completion is a settlement record.
      transaction.status = status;
      transaction.statusHistory.push({ status, changedAt: new Date(), changedBy: adminId, note: status === "DECLINED" ? customerReason : note?.trim() || labels[status] });
      if (note?.trim()) transaction.adminNotes.push({ actorId: adminId, note: note.trim(), createdAt: new Date() });
      if (status === "APPROVED") { transaction.approvedBy = adminId; transaction.approvedAt = new Date(); }
      if (status === "DECLINED") { transaction.declinedBy = adminId; transaction.declinedAt = new Date(); transaction.declineReason = note; transaction.customerDeclineReason = customerReason; }
      if (status === "COMPLETED") { transaction.completedAt = new Date(); transaction.completionNotifiedAt = new Date(); }
      await transaction.save({ session });
      await AuditLog.create([{ actorId: adminId, action: `TRANSACTION_${status}`, entityId: transaction._id, metadata: { reference: transaction.reference, previousStatus, newStatus: status, reason: note?.trim() } }], { session, ordered: true });
      if (["APPROVED", "DECLINED", "FAILED", "COMPLETED"].includes(status)) {
        await Receipt.create([{ transactionId, userId: transaction.userId, number: await uniqueReference("RCT"), status, issuedAt: new Date() }], { session, ordered: true });
      }
      userId = String(transaction.userId);
      const detail = `Reference: ${transaction.reference}\nAmount: ${(transaction.amount / 100).toFixed(2)} ${transaction.currency}\nType: ${transaction.type}\nStatus: ${status}\nDate: ${new Date().toISOString()}${status === "DECLINED" ? `\nReason: ${customerReason}` : ""}`;
      const notice = await queueNotification({ userId, type: `TRANSACTION_${status}`, subject: `Transaction ${status.replaceAll("_", " ").toLowerCase()}`, body: `${labels[status]}\n${detail}`, href: `/dashboard/transactions/${transactionId}`, eventKey: `TRANSACTION_${status}:${transactionId}:${transaction.statusHistory.length}`, details: { transactionId, reference: transaction.reference, status } }, session);
      jobId = notice.jobId;
    });
  } finally { await session.endSession(); }
  if (userId) broadcastNotification(userId);
  if (jobId) { try { await deliverEmailJob(jobId); } catch { /* Retry from email queue. */ } }
  return Transaction.findById(transactionId);
}

export async function addAdminNote(adminId: string, transactionId: string, note: string) {
  if (!mongoose.isValidObjectId(transactionId) || !note.trim() || note.length > 2000) throw new AppError("Invalid note.", 422);
  const transaction = await Transaction.findByIdAndUpdate(transactionId, { $push: { adminNotes: { actorId: adminId, note: note.trim(), createdAt: new Date() } } }, { new: true });
  if (!transaction) throw new AppError("Transaction not found.", 404);
  await AuditLog.create({ actorId: adminId, action: "TRANSACTION_NOTE", entityId: transaction._id, metadata: { reference: transaction.reference } });
  return transaction;
}
