import mongoose, { Schema, model, models } from "mongoose";

const ref = { type: Schema.Types.ObjectId, required: true };
const base = { timestamps: true } as const;
function named(name: string, schema: Schema) { return models[name] || model(name, schema); }

export const User = named("User", new Schema({ surname: String, firstName: String, lastName: String, email: { type: String, unique: true, required: true, lowercase: true }, passwordHash: { type: String, required: true }, preferredLocale: { type: String, enum: ["en", "es", "fr", "de", "pt", "it", "nl", "ar"] }, country: String, homeAddress: String, phoneNumber: String, role: { type: String, enum: ["CUSTOMER", "ADMIN"], default: "CUSTOMER" }, emailVerified: { type: Boolean, default: false }, identityVerified: { type: Boolean, default: false }, verificationStatus: { type: String, enum: ["PENDING", "APPROVED", "REVIEW_REQUIRED", "REJECTED"], default: "PENDING" }, transactionPinHash: String, pinFailures: { type: Number, default: 0 }, pinLockedUntil: Date }, base));
const accountSchema = new Schema({ userId: ref, name: { type: String, enum: ["Cash Account", "Gold Account"] }, currency: { type: String, enum: ["USD", "GBP"] }, availableBalance: { type: Number, default: 0 }, ledgerBalance: { type: Number, default: 0 }, status: { type: String, enum: ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED"], default: "PENDING_VERIFICATION" } }, base);
accountSchema.index({ userId: 1, name: 1 }, { unique: true });
export const Account = named("Account", accountSchema);
export const Verification = named("Verification", new Schema({ userId: ref, documentType: String, documentPath: String, claimedName: String, status: { type: String, enum: ["PENDING", "APPROVED", "REVIEW_REQUIRED", "REJECTED"] }, reason: String }, base));
const challenge = (idField: string) => { const schema = new Schema({ [idField]: ref, codeHash: { type: String, required: true }, expiresAt: Date, attemptCount: { type: Number, default: 0 }, usedAt: Date }, base); schema.index({ [idField]: 1, createdAt: -1 }); return schema; };
export const EmailVerificationChallenge = named("EmailVerificationChallenge", challenge("userId"));
export const AdminTransactionChallenge = named("AdminTransactionChallenge", challenge("transactionId"));
const transactionSchema = new Schema({ userId: ref, accountId: ref, beneficiaryId: ref, amount: Number, currency: String, reference: { type: String, unique: true }, description: String, status: { type: String, enum: ["DRAFT", "AWAITING_TRANSACTION_PIN", "AWAITING_ADMIN_AUTHORIZATION", "AUTHORIZED", "PENDING", "COMPLETED", "FAILED", "CANCELLED"], default: "AWAITING_TRANSACTION_PIN" }, pendingAt: Date, pendingFollowupAt: Date }, base);
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, pendingAt: 1 });
export const Transaction = named("Transaction", transactionSchema);
const ledgerSchema = new Schema({ userId: ref, accountId: ref, transactionId: Schema.Types.ObjectId, operationKey: { type: String, required: true, unique: true }, type: String, amount: Number, status: String }, base);
export const LedgerEntry = named("LedgerEntry", ledgerSchema);
export const Beneficiary = named("Beneficiary", new Schema({ userId: ref, name: String, bankName: String, accountIdentifier: String, currency: String }, base));
const messageSchema = new Schema({ userId: ref, type: String, subject: String, body: String, details: Schema.Types.Mixed, readAt: Date, archivedAt: Date }, base);
messageSchema.index({ userId: 1, createdAt: -1 });
export const Message = named("Message", messageSchema);
const notificationSchema = new Schema({ userId: ref, type: String, title: String, href: String, readAt: Date }, base);
notificationSchema.index({ userId: 1, createdAt: -1 });
export const Notification = named("Notification", notificationSchema);
export const EmailJob = named("EmailJob", new Schema({ userId: Schema.Types.ObjectId, to: String, subject: String, html: String, text: String, status: { type: String, enum: ["QUEUED", "SENT", "FAILED"], default: "QUEUED" }, attemptCount: { type: Number, default: 0 }, error: String, sentAt: Date }, base));
export const TransactionAuthorization = named("TransactionAuthorization", new Schema({ transactionId: { ...ref, unique: true }, customerAuthorizedAt: Date, adminAuthorizedAt: Date }, base));
const supportConversationSchema = new Schema({ userId: { ...ref, ref: "User" }, assignedAdminId: Schema.Types.ObjectId, subject: String, transactionReference: String, status: { type: String, enum: ["OPEN", "ASSIGNED", "WAITING_FOR_USER", "WAITING_FOR_SUPPORT", "RESOLVED", "CLOSED"], default: "OPEN" }, priority: { type: String, default: "NORMAL" }, lastMessageAt: Date }, base);
supportConversationSchema.index({ userId: 1, lastMessageAt: -1 });
supportConversationSchema.index({ status: 1, lastMessageAt: -1 });
export const SupportConversation = named("SupportConversation", supportConversationSchema);
const supportMessageSchema = new Schema({ conversationId: ref, senderId: ref, senderRole: String, body: String, readAt: Date }, base);
supportMessageSchema.index({ conversationId: 1, createdAt: 1 });
export const SupportMessage = named("SupportMessage", supportMessageSchema);
export const AuditLog = named("AuditLog", new Schema({ actorId: Schema.Types.ObjectId, action: String, entityId: Schema.Types.ObjectId, metadata: Schema.Types.Mixed }, base));
export type MongoSession = mongoose.ClientSession;
