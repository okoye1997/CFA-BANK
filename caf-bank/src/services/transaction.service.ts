import mongoose from "mongoose";
import { Beneficiary, Transaction, User } from "@/lib/models";
import { connectMongo } from "@/lib/mongodb";
import { formatMoney } from "@/lib/money";
import { applicationName } from "@/lib/app-config";
import { broadcastNotification, queueNotification } from "./notification.service";
import { deliverEmailJob } from "@/lib/email/send-email";

export async function processCompletedTransferNotifications() {
  await connectMongo();
  const completed = await Transaction.find({ status: "COMPLETED", completionNotifiedAt: null }).sort({ updatedAt: 1 }).limit(100).select("_id");
  let processed = 0;
  for (const item of completed) {
    const session = await mongoose.startSession();
    let jobId: string | undefined;
    let userId: string | undefined;
    try {
      await session.withTransaction(async () => {
        const transaction = await Transaction.findOne({ _id: item._id, status: "COMPLETED", completionNotifiedAt: null }).session(session);
        if (!transaction) return;
        const [user, beneficiary] = await Promise.all([User.findById(transaction.userId).session(session), Beneficiary.findOne({ _id: transaction.beneficiaryId, userId: transaction.userId }).session(session)]);
        if (!user || (!transaction.recipientName && !beneficiary)) throw new Error("Completed transfer recipient or owner is unavailable.");
        const amount = formatMoney(transaction.amount, transaction.currency || "USD", user.preferredLocale || "en");
        const date = new Intl.DateTimeFormat(user.preferredLocale || "en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(transaction.completedAt || transaction.updatedAt);
        const recipient = transaction.recipientName || beneficiary!.name;
        const body = `Your transfer of ${amount} to ${recipient} was successful.\n\nReference: ${transaction.reference}\nDate: ${date}`;
        const emailBody = `Your transfer has been completed successfully.\n\nTransaction Details\nAmount: ${amount}\nRecipient: ${recipient}\nTransaction Reference: ${transaction.reference}\nDate: ${date}\nStatus: Successful\n\nYour transaction history has been updated accordingly.\n\nIf you do not recognize this transaction, please contact support immediately using the support center in your secure account.\n\nRegards,\n${applicationName}`;
        const notice = await queueNotification({ userId: String(user._id), type: "TRANSFER_SUCCESS", subject: "Transfer Successful", body, emailSubject: `Transfer Successful — ${transaction.reference}`, emailBody, href: "/dashboard/transactions", eventKey: `TRANSFER_SUCCESS:${transaction._id}`, details: { transactionId: String(transaction._id), amount: String(transaction.amount), currency: transaction.currency || "USD", recipient, reference: transaction.reference, date: (transaction.completedAt || transaction.updatedAt).toISOString() } }, session);
        transaction.completionNotifiedAt = new Date();
        await transaction.save({ session });
        userId = String(user._id);
        jobId = notice.jobId;
      });
    } catch (error) {
      if (![11000, 112].includes((error as { code?: number }).code || 0)) throw error;
      continue;
    } finally { await session.endSession(); }
    if (userId) { processed++; broadcastNotification(userId); }
    if (jobId) { try { await deliverEmailJob(jobId); } catch { /* The queued job can be retried. */ } }
  }
  return processed;
}

export async function sendPendingFollowups() {
  await connectMongo();
  const cutoff = new Date(Date.now() - 24 * 60 * 60_000);
  const pending = await Transaction.find({ status: "PENDING", pendingAt: { $lte: cutoff }, pendingFollowupAt: null }).limit(100).select("userId");
  let processed = 0;
  for (const transaction of pending) {
    const session = await mongoose.startSession();
    let jobId: string | undefined;
    try {
      await session.withTransaction(async () => {
        const claimed = await Transaction.findOneAndUpdate({ _id: transaction._id, status: "PENDING", pendingFollowupAt: null }, { $set: { pendingFollowupAt: new Date() } }, { returnDocument: "after", session });
        if (!claimed) return;
        const notice = await queueNotification({ userId: String(claimed.userId), type: "PENDING_FOLLOWUP", subject: "Transaction still pending", body: "Your transaction is still being processed. If you need assistance, contact support through your account.", href: "/dashboard/support" }, session);
        jobId = notice.jobId;
        processed++;
      });
    } finally { await session.endSession(); }
    if (jobId) { try { await deliverEmailJob(jobId); } catch { /* queued job can be retried */ } }
  }
  return processed;
}
