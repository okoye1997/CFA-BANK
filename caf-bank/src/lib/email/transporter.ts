import nodemailer from "nodemailer";
export function mailTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.EMAIL_FROM) return null;
  return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT), secure: process.env.SMTP_SECURE === "true", auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined });
}
