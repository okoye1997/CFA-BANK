import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { Verification, User } from "@/lib/models";
import { AppError } from "@/lib/http";
import { audit } from "./audit.service";
import { activateVerifiedAccount } from "./account.service";

function normalizeName(name: string) { return name.normalize("NFKD").toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim(); }
type VerificationStatus = "PENDING" | "APPROVED" | "REVIEW_REQUIRED" | "REJECTED";
export const identityVerificationService = {
  async verify({ registeredName, claimedName }: { registeredName: string; claimedName: string; documentPath: string; documentType: string; mimeType: string }): Promise<{ status: VerificationStatus; reason: string }> {
    const namesMatch = normalizeName(registeredName) === normalizeName(claimedName);
    return { status: "REVIEW_REQUIRED", reason: namesMatch ? "Document authenticity requires review." : "Name mismatch requires review." };
  },
};

export async function submitIdentity(userId: string, documentType: string, claimedName: string, file: File) {
  if (!file || file.size === 0 || file.size > 8 * 1024 * 1024) throw new AppError("Upload a document up to 8 MB.", 422);
  if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) throw new AppError("Use a PDF, JPEG, or PNG document.", 422);
  if (!["Passport", "National ID", "Driver's Licence"].includes(documentType)) throw new AppError("Select a document type.", 422);
  const user = await User.findById(userId);
  if (!user?.emailVerified) throw new AppError("Verify your email first.", 403);
  if (user.identityVerified) return { status: "APPROVED" as const, reason: "Identity already verified." };
  const bytes = Buffer.from(await file.arrayBuffer());
  const signatureValid = file.type === "application/pdf" ? bytes.subarray(0, 5).toString() === "%PDF-" : file.type === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!signatureValid) throw new AppError("Document content does not match its file type.", 422);
  const privateDir = path.join(process.cwd(), ".private", "identity");
  await mkdir(privateDir, { recursive: true });
  const extension = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" }[file.type];
  const documentPath = path.join(privateDir, `${randomUUID()}.${extension}`);
  await writeFile(documentPath, bytes, { flag: "wx", mode: 0o600 });
  const registeredName = [user.surname, user.firstName, user.lastName].filter(Boolean).join(" ");
  const result = await identityVerificationService.verify({ registeredName, claimedName, documentPath, documentType, mimeType: file.type });
  const verification = await Verification.create({ userId, documentType, claimedName, documentPath, ...result });
  user.verificationStatus = result.status;
  user.identityVerified = result.status === "APPROVED";
  await user.save();
  await audit("IDENTITY_VERIFICATION_RESULT", userId, undefined, { status: result.status });
  if (result.status === "APPROVED") {
    try { await activateVerifiedAccount(userId); }
    catch (error) {
      user.identityVerified = false; user.verificationStatus = "REVIEW_REQUIRED"; await user.save();
      verification.status = "REVIEW_REQUIRED"; await verification.save();
      throw error;
    }
  }
  return result;
}

export async function approveIdentity(adminId: string, verificationId: string, approve: boolean) {
  const verification = await Verification.findById(verificationId);
  if (!verification || verification.status !== "REVIEW_REQUIRED") throw new AppError("Verification is not awaiting review.", 409);
  verification.status = approve ? "APPROVED" : "REJECTED"; await verification.save();
  const user = await User.findById(verification.userId);
  user.identityVerified = approve; user.verificationStatus = verification.status; await user.save();
  await audit("IDENTITY_ADMIN_REVIEW", adminId, String(verification._id), { result: verification.status });
  if (approve) {
    try { await activateVerifiedAccount(String(user._id)); }
    catch (error) {
      user.identityVerified = false; user.verificationStatus = "REVIEW_REQUIRED"; await user.save();
      verification.status = "REVIEW_REQUIRED"; await verification.save();
      throw error;
    }
  }
}
