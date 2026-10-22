import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { connectMongo } from "@/lib/mongodb";
import { Account, EmailVerificationChallenge, User } from "@/lib/models";
import { registrationSchema } from "@/lib/validation";
import { AppError } from "@/lib/http";
import { sendSecretCodeEmail } from "@/lib/email/send-email";
import { audit } from "./audit.service";

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
    await audit("REGISTRATION", String(user._id));
  } catch (error) { await Promise.all([Account.deleteMany({ userId: user._id }), User.deleteOne({ _id: user._id })]); throw error; }
  return { email: user.email };
}

export async function issueVerificationCode(user: { _id: unknown; email: string; firstName: string }) {
  const recent = await EmailVerificationChallenge.findOne({ userId: user._id }).sort({ createdAt: -1 });
  if (recent && Date.now() - recent.createdAt.getTime() < 60_000) throw new AppError("Wait one minute before requesting another code.", 429);
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 12);
  const challenge = await EmailVerificationChallenge.create({ userId: user._id, codeHash, expiresAt: new Date(Date.now() + 10 * 60_000) });
  try { await sendSecretCodeEmail({ to: user.email, subject: "Verify your CAF Bank email", customerName: user.firstName, message: `Your verification code is ${code}. It expires in 10 minutes.`, safeMessage: "A one-time verification code was sent. The code is never stored in this email job." }); }
  catch (error) { await EmailVerificationChallenge.deleteOne({ _id: challenge._id }); throw error; }
}

export async function verifyEmail(emailInput: string, code: string) {
  await connectMongo();
  const email = emailInput.toLowerCase().trim();
  const user = await User.findOne({ email });
  if (!user) throw new AppError("Invalid verification code.", 400);
  if (user.emailVerified) return;
  const challenge = await EmailVerificationChallenge.findOne({ userId: user._id, usedAt: null }).sort({ createdAt: -1 });
  if (!challenge || challenge.expiresAt < new Date() || challenge.attemptCount >= 5) throw new AppError("Code expired or attempts exhausted. Request another code.", 429);
  challenge.attemptCount++;
  if (!/^\d{6}$/.test(code) || !await bcrypt.compare(code, challenge.codeHash)) { await challenge.save(); throw new AppError("Invalid verification code.", 400); }
  challenge.usedAt = new Date(); await challenge.save();
  await EmailVerificationChallenge.updateMany({ userId: user._id, usedAt: null }, { $set: { usedAt: new Date() } });
  user.emailVerified = true; await user.save();
  await audit("EMAIL_VERIFICATION", String(user._id));
}
