import mongoose from "mongoose";
import { Account, AuditLog, LedgerEntry, User } from "@/lib/models";
import { connectMongo } from "@/lib/mongodb";
import { deliverEmailJob } from "@/lib/email/send-email";
import { broadcastNotification, queueNotification } from "./notification.service";

export async function activateVerifiedAccount(userId: string) {
  await connectMongo();
  const operationKey = `ACCOUNT_ACTIVATION_CREDIT:${userId}`;
  let credited = false;
  let creditJobId: string | undefined;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user?.emailVerified || !user.identityVerified) throw new Error("Verification required.");
      if (await LedgerEntry.exists({ operationKey }).session(session)) return;
      const cash = await Account.findOne({ userId, name: "Cash Account" }).session(session);
      if (!cash) throw new Error("Cash Account missing.");
      const amount = 1_000_000_000;
      await LedgerEntry.create([{ userId, accountId: cash._id, operationKey, type: "ACCOUNT_ACTIVATION_CREDIT", amount, status: "COMPLETED" }], { session, ordered: true });
      await Account.updateOne({ _id: cash._id }, { $inc: { availableBalance: amount, ledgerBalance: amount }, $set: { status: "ACTIVE" } }, { session });
      await Account.updateOne({ userId, name: "Gold Account" }, { $set: { status: "ACTIVE" } }, { session });
      const body = `Your account verification has been completed successfully. A credit of $10,000,000.00 has been posted to your Cash Account.\nAmount: $10,000,000.00\nTransaction Reference: ${operationKey}\nDate: ${new Date().toISOString()}\nStatus: Completed\nAccount: Cash Account`;
      await AuditLog.create([{ actorId: userId, action: "ACCOUNT_ACTIVATION", metadata: { operationKey } }, { actorId: userId, action: "ACCOUNT_ACTIVATION_CREDIT", metadata: { operationKey } }], { session, ordered: true });
      const notice = await queueNotification({ userId, type: "CREDIT", subject: "Account verified — credit received", emailSubject: "Credit Alert", body, href: "/dashboard/accounts" }, session);
      creditJobId = notice.jobId;
      credited = true;
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000 && await LedgerEntry.exists({ operationKey })) return false;
    throw error;
  } finally { await session.endSession(); }
  if (credited) broadcastNotification(userId);
  if (creditJobId) { try { await deliverEmailJob(creditJobId); } catch { /* queued job can be retried */ } }
  return credited;
}
