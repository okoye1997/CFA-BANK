import { EmailJob } from "@/lib/models";
import { mailTransporter } from "./transporter";
import { renderEmail } from "./templates";
import { AppError } from "@/lib/http";
export async function deliverEmailJob(jobId: string) {
  const job = await EmailJob.findById(jobId);
  if (!job || job.status !== "QUEUED") return;
  const transport = mailTransporter();
  if (!transport) return;
  try {
    await transport.sendMail({ from: process.env.EMAIL_FROM, to: job.to, subject: job.subject, html: job.html, text: job.text });
    job.status = "SENT"; job.sentAt = new Date(); job.attemptCount++; await job.save();
  } catch {
    job.status = "FAILED"; job.error = "SMTP delivery failed"; job.attemptCount++; await job.save();
  }
}
export async function sendSecretCodeEmail({ to, subject, customerName, message, safeMessage, action }: { to: string; subject: string; customerName: string; message: string; safeMessage: string; action?: { label: string; href: string } }) {
  const transport = mailTransporter();
  if (!transport) throw new AppError("Email delivery is not configured.", 503);
  const safe = renderEmail({ title: subject, customerName, content: safeMessage });
  const actual = renderEmail({ title: subject, customerName, content: message, action });
  try {
    await transport.sendMail({ from: process.env.EMAIL_FROM, to, subject, ...actual });
  } catch {
    await EmailJob.create({ to, subject, ...safe, status: "FAILED", error: "SMTP delivery failed", attemptCount: 1 });
    throw new AppError("Email delivery failed. Please try again.", 503);
  }
  await EmailJob.create({ to, subject, ...safe, status: "SENT", sentAt: new Date(), attemptCount: 1 });
}
