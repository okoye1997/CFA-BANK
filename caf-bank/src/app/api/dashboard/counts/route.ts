import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Message, Notification, SupportConversation, SupportMessage } from "@/lib/models";
import { respondError } from "@/lib/http";
export async function GET() { try { const user = await currentUser(); const ids = await SupportConversation.find({ userId: user._id }).distinct("_id"); const [messages, notifications, support] = await Promise.all([Message.countDocuments({ userId: user._id, readAt: null, archivedAt: null }), Notification.countDocuments({ userId: user._id, readAt: null }), SupportMessage.countDocuments({ conversationId: { $in: ids }, senderRole: "ADMIN", readAt: null })]); return NextResponse.json({ messages, notifications, support }); } catch (error) { return respondError(error); } }
