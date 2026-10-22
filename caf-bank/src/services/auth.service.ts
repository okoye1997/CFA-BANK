import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { randomBytes, randomInt } from "crypto";
import { connectMongo } from "@/lib/mongodb";
import { Account, AuditLog, EmailVerificationChallenge, User } from "@/lib/models";
import { registrationSchema } from "@/lib/validation";
import { AppError } from "@/lib/http";
import { sendSecretCodeEmail } from "@/lib/email/send-email";
import { deliverEmailJob } from "@/lib/email/send-email";
import { applicationName, applicationUrl } from "@/lib/app-config";
import { audit } from "./audit.service";
import { broadcastNotification, queueNotification } from "./notification.service";

const verificationMinutes = 10;

export async function register(input: unknown, preferredLocale?: string) {
  const data = registrationSchema.parse(input);
  await connectMongo();
  if (await User.exists({ email: data.email })) throw new AppError("Email address is already registered.", 409);
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await User.create({ ...data, password: undefined, passwordHash, preferredLocale });
  try {
    await Account.create([
      { userId: user._id, name: "Cash Account", currency: "USD", availableBalance: 0, ledgerBalance: 0 },
      { userId: user._id, name: "Gold Account", currency: "GBP", availableBalance: 0, ledgerBalance: 0 },
    ]);
    await issueVerificationCode(user);
    await queueNotification({ userId: String(user._id), type: "VERIFICATION_REQUIRED", subject: "Email verification required", body: "Check your email for a verification link or code to secure your account.", href: "/verify-email", email: false });
    broadcastNotification(String(user._id));
    await audit("REGISTRATION", String(user._id));
  } catch (error) { await Promise.all([Account.deleteMany({ userId: user._id }), User.deleteOne({ _id: user._id })]); throw error; }
  return { email: user.email };
}

export async function issueVerificationCode(user: { _id: unknown; email: string; firstName: string }) {
  const recent = await EmailVerificationChallenge.findOne({ userId: user._id }).sort({ createdAt: -1 });
  if (recent && Date.now() - recent.createdAt.getTime() < 60_000) throw new AppError("Wait one minute before requesting another code.", 429);
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const token = randomBytes(32).toString("hex");
  const codeHash = await bcrypt.hash(code, 12);
  const tokenHash = await bcrypt.hash(token, 12);
  const link = new URL("/verify-email", applicationUrl());
  link.searchParams.set("email", user.email);
  link.searchParams.set("token", token);
  const challenge = await EmailVerificationChallenge.create({ userId: user._id, codeHash, tokenHash, expiresAt: new Date(Date.now() + verificationMinutes * 60_000) });
  const message = `Thank you for creating your account.\n\nTo complete your registration and secure your account, please verify your email address by selecting the button below.\n\nYou can also enter this verification code in the application: ${code}\n\nFor your security, this verification link and code will expire in ${verificationMinutes} minutes.\n\nIf you did not create this account, you can safely ignore this email.\n\nRegards,\n${applicationName}`;
  try { await sendSecretCodeEmail({ to: user.email, subject: "Verify your email address", customerName: user.firstName, message, safeMessage: "A one-time verification link and code were sent. The credentials are never stored in this email job.", action: { label: "Verify Email Address", href: link.toString() } }); }
  catch (error) { await EmailVerificationChallenge.deleteOne({ _id: challenge._id }); throw error; }
}

export async function verifyEmail(emailInput: string, credential: string) {
  await connectMongo();
  const email = emailInput.toLowerCase().trim();
  const user = await User.findOne({ email });
  if (!user) throw new AppError("Invalid verification code.", 400);
  if (user.emailVerified) return false;
  const challenge = await EmailVerificationChallenge.findOne({ userId: user._id, usedAt: null }).sort({ createdAt: -1 });
  if (!challenge || challenge.expiresAt < new Date() || challenge.attemptCount >= 5) throw new AppError("Code expired or attempts exhausted. Request another code.", 429);
  const validCode = /^\d{6}$/.test(credential) && await bcrypt.compare(credential, challenge.codeHash);
  const validToken = /^[a-f0-9]{64}$/.test(credential) && Boolean(challenge.tokenHash) && await bcrypt.compare(credential, challenge.tokenHash);
  if (!validCode && !validToken) { await EmailVerificationChallenge.updateOne({ _id: challenge._id, usedAt: null }, { $inc: { attemptCount: 1 } }); throw new AppError("Invalid verification code.", 400); }
  const session = await mongoose.startSession();
  let jobId: string | undefined;
  try {
    await session.withTransaction(async () => {
      const claimed = await EmailVerificationChallenge.findOneAndUpdate({ _id: challenge._id, usedAt: null, expiresAt: { $gt: new Date() }, attemptCount: { $lt: 5 } }, { $set: { usedAt: new Date() } }, { session, returnDocument: "after" });
      if (!claimed) throw new AppError("Verification link or code has expired or been used.", 409);
      const updated = await User.updateOne({ _id: user._id, emailVerified: false }, { $set: { emailVerified: true } }, { session });
      if (!updated.modifiedCount) throw new AppError("Email is already verified.", 409);
      await EmailVerificationChallenge.updateMany({ userId: user._id, usedAt: null }, { $set: { usedAt: new Date() } }, { session });
      const notice = await queueNotification({ userId: String(user._id), type: "VERIFICATION_SUCCESS", subject: "Email Verified Successfully", body: "Your email address has been successfully verified. Your account is now ready to use.", href: "/identity-verification", emailSubject: "Email Verification Successful", emailBody: `Your email address has been successfully verified.\n\nYou can now securely sign in to your account.\n\nIf you did not perform this action, please contact support using the support center in your secure account.\n\nRegards,\n${applicationName}`, eventKey: `EMAIL_VERIFIED:${user._id}` }, session);
      jobId = notice.jobId;
      await AuditLog.create([{ action: "EMAIL_VERIFICATION", actorId: user._id }], { session });
    });
  } finally { await session.endSession(); }
  broadcastNotification(String(user._id));
  if (jobId) { try { await deliverEmailJob(jobId); } catch { /* Queued job can be retried. */ } }
  return true;
}
