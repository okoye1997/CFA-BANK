import { SupportConversation, SupportMessage } from "@/lib/models";
import { AppError } from "@/lib/http";
import { notify } from "./notification.service";
import { audit } from "./audit.service";
export async function listConversations(userId: string, admin: boolean) {
  const query = SupportConversation.find(admin ? {} : { userId }).sort({ lastMessageAt: -1, createdAt: -1 }).limit(100);
  if (admin) query.populate("userId", "firstName surname email");
  const conversations = await query.lean();
  return Promise.all(conversations.map(async conversation => ({ ...conversation, unreadCount: await SupportMessage.countDocuments({ conversationId: conversation._id, senderRole: admin ? "CUSTOMER" : "ADMIN", readAt: null }) })));
}
export async function startConversation(userId: string, subject: string, transactionReference?: string) {
  if (!subject.trim()) throw new AppError("Enter a subject.", 422);
  if (transactionReference && !/^[A-Z0-9-]{4,40}$/.test(transactionReference)) throw new AppError("Enter a valid transaction reference.", 422);
  return SupportConversation.create({ userId, subject: subject.trim().slice(0, 120), transactionReference, status: "OPEN", lastMessageAt: new Date() });
}
export async function listSupportMessages(conversationId: string, userId: string, admin: boolean) {
  const conversation = await SupportConversation.findOne(admin ? { _id: conversationId } : { _id: conversationId, userId });
  if (!conversation) throw new AppError("Conversation not found.", 404);
  await SupportMessage.updateMany({ conversationId, senderRole: admin ? "CUSTOMER" : "ADMIN", readAt: null }, { $set: { readAt: new Date() } });
  return SupportMessage.find({ conversationId }).sort({ createdAt: 1 }).select("senderRole body readAt createdAt").lean();
}
export async function sendSupportMessage(conversationId: string, userId: string, admin: boolean, body: string) {
  const conversation = await SupportConversation.findOne(admin ? { _id: conversationId } : { _id: conversationId, userId });
  if (!conversation) throw new AppError("Conversation not found.", 404);
  if (!body.trim() || body.length > 2000) throw new AppError("Enter a message up to 2,000 characters.", 422);
  const message = await SupportMessage.create({ conversationId, senderId: userId, senderRole: admin ? "ADMIN" : "CUSTOMER", body: body.trim() });
  globalThis.supportIO?.to(`support:${conversationId}`).emit("support:message", { conversationId });
  conversation.status = admin ? "WAITING_FOR_USER" : "WAITING_FOR_SUPPORT";
  conversation.lastMessageAt = new Date(); await conversation.save();
  if (admin) {
    await notify({ userId: String(conversation.userId), type: "SUPPORT", subject: "You have a new support message", body: "The support team has replied to your conversation.", href: "/dashboard/support" });
    await audit("SUPPORT_REPLY", userId, conversationId);
  }
  return message;
}
export async function updateConversation(conversationId: string, adminId: string, status: string, assignedAdminId?: string) {
  if (!["OPEN", "ASSIGNED", "WAITING_FOR_USER", "WAITING_FOR_SUPPORT", "RESOLVED", "CLOSED"].includes(status)) throw new AppError("Invalid status.", 422);
  const conversation = await SupportConversation.findByIdAndUpdate(conversationId, { status, ...(assignedAdminId ? { assignedAdminId } : {}) }, { returnDocument: "after" });
  if (!conversation) throw new AppError("Conversation not found.", 404);
  await audit("SUPPORT_ADMIN_ACTION", adminId, conversationId, { status });
  return conversation;
}
