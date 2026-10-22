import { EmailJob, Message, Notification, User } from "@/lib/models";
import { renderEmail } from "@/lib/email/templates";
import { deliverEmailJob } from "@/lib/email/send-email";
import type { ClientSession } from "mongoose";
type Notice = { userId: string; type: string; subject: string; body: string; href?: string; email?: boolean; emailSubject?: string; details?: Record<string, string> };
export async function queueNotification({ userId, type, subject, body, href, email = true, emailSubject, details }: Notice, session?: ClientSession) {
  const options = session ? { session, ordered: true } : { ordered: true };
  const [message] = await Message.create([{ userId, type, subject, body, details }], options);
  await Notification.create([{ userId, type, title: subject, href }], options);
  let jobId: string | undefined;
  if (email) {
    const user = await User.findById(userId).select("email firstName").session(session || null);
    if (user) {
      const rendered = renderEmail({ title: emailSubject || subject, customerName: user.firstName, content: body, action: href ? { label: "View in CAF Bank", href: `${process.env.APP_URL || "http://localhost:3000"}${href}` } : undefined });
      const [job] = await EmailJob.create([{ userId, to: user.email, subject: emailSubject || subject, ...rendered }], options);
      jobId = String(job._id);
    }
  }
  return { message, jobId };
}
export async function notify(input: Notice) {
  const result = await queueNotification(input);
  broadcastNotification(input.userId);
  if (result.jobId) await deliverEmailJob(result.jobId);
  return result.message;
}
export function broadcastNotification(userId: string) { globalThis.supportIO?.to(`user:${userId}`).emit("notification:new"); }
