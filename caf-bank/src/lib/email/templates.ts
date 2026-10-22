import { applicationName, applicationUrl } from "@/lib/app-config";

function escape(value: string) { return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!); }
function safeActionUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) ? url.toString() : undefined;
  } catch { return undefined; }
}
export function renderEmail({ title, customerName, content, action }: { title: string; customerName: string; content: string; action?: { label: string; href: string } }) {
  const name = applicationName;
  const href = safeActionUrl(action?.href);
  let logoUrl: string | undefined;
  try { logoUrl = safeActionUrl(new URL("/branding/logo.png", applicationUrl()).toString()); } catch { /* Optional image. */ }
  const body = escape(content).replace(/\n/g, "<br>");
  const header = logoUrl ? `<img src="${escape(logoUrl)}" width="32" height="32" alt="" style="vertical-align:middle;margin-right:10px;border-radius:7px">` : "";
  const button = href && action ? `<p style="margin:28px 0"><a href="${escape(href)}" style="display:inline-block;background:#0a63ce;color:#fff;padding:14px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${escape(action.label)}</a></p>` : "";
  const support = "If you need assistance, visit the support center in your secure account.";
  return {
    html: `<div style="background:#eef4ff;padding:24px 12px;font-family:Arial,sans-serif;color:#17335a"><div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;overflow:hidden"><div style="background:#0a3f92;color:#fff;padding:24px;font-weight:bold;font-size:22px">${header}${escape(name)}</div><div style="padding:24px"><h1 style="font-size:24px;line-height:1.3">${escape(title)}</h1><p>Hello ${escape(customerName)},</p><p style="line-height:1.6">${body}</p>${button}<p style="line-height:1.6">${support}</p><p style="font-size:12px;color:#62748d">For your security, ${escape(name)} will never ask for your password or transaction PIN by email.</p></div><div style="background:#f4f7fc;padding:18px 24px;font-size:12px">${escape(name)}</div></div></div>`,
    text: `${name}\n${title}\n\nHello ${customerName},\n\n${content}\n\n${action && href ? `${action.label}: ${href}\n\n` : ""}${support}\nFor your security, ${name} will never ask for your password or transaction PIN by email.\n${name}`,
  };
}
