import mongoose from "mongoose";
import { Transaction } from "@/lib/models";
import { connectMongo } from "@/lib/mongodb";
import { queueNotification } from "./notification.service";
import { deliverEmailJob } from "@/lib/email/send-email";

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
