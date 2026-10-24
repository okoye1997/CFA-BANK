import mongoose from "mongoose";
import { currentUser } from "@/lib/auth";
import { Account, Receipt, Transaction, User } from "@/lib/models";
import { AppError, respondError } from "@/lib/http";
import { maskedAccount } from "@/lib/identifiers";
import { applicationName } from "@/lib/app-config";

function escape(value: unknown) { return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!); }

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { try {
  const actor = await currentUser(); const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw new AppError("Receipt not found.", 404);
  const transaction = await Transaction.findById(id);
  if (!transaction || (actor.role !== "ADMIN" && String(transaction.userId) !== String(actor._id))) throw new AppError("Receipt not found.", 404);
  const receipt = await Receipt.findOne({ transactionId: id }).sort({ issuedAt: -1 });
  if (!receipt) throw new AppError("Receipt not found.", 404);
  const [owner, source, destination] = await Promise.all([User.findById(transaction.userId).select("firstName surname"), Account.findById(transaction.accountId).select("accountNumber name"), transaction.destinationAccountId ? Account.findById(transaction.destinationAccountId).select("accountNumber name") : null]);
  const sender = `${owner?.firstName || "Customer"} ${owner?.surname || ""}`.trim();
  const recipient = destination?.name || transaction.recipientName || "Recipient";
  const rows = [
    ["Status", receipt.status], ["Transaction reference", transaction.reference], ["Receipt number", receipt.number],
    ["Date and time", receipt.issuedAt?.toISOString()], ["Sender", sender], ["From account", `${source?.name || "Account"} ${maskedAccount(source?.accountNumber)}`],
    ["Recipient", recipient], ["To account", destination ? `${destination.name} ${maskedAccount(destination.accountNumber)}` : "External beneficiary"],
    ["Type", transaction.type], ["Amount", `${(transaction.amount / 100).toFixed(2)} ${transaction.currency}`],
    ["Fee", `${((transaction.feeAmount || 0) / 100).toFixed(2)} ${transaction.currency}`], ["Total debit", `${((transaction.amount + (transaction.feeAmount || 0)) / 100).toFixed(2)} ${transaction.currency}`],
    ["Description", transaction.description],
  ];
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(applicationName)} receipt ${escape(receipt.number)}</title><style>*{box-sizing:border-box}body{font:16px Arial,sans-serif;color:#17335a;max-width:700px;margin:0 auto;padding:clamp(12px,4vw,24px);overflow-wrap:anywhere}.head{background:#0a3f92;color:white;padding:22px;border-radius:12px;display:flex;align-items:center;gap:14px}.head img{width:40px;height:40px}h1{font-size:24px}dl{display:grid;grid-template-columns:1fr 1fr;gap:14px;border:1px solid #dbe4f1;padding:22px;border-radius:12px}dt{color:#596b81}dd{margin:0;font-weight:bold;overflow-wrap:anywhere}footer{font-size:13px;color:#596b81;margin-top:30px}button{min-height:44px;margin-top:20px;padding:10px 16px}@media(max-width:600px){dl{grid-template-columns:1fr;gap:6px}.head{padding:16px}h1{font-size:22px}dd{margin-bottom:10px}}@media print{button{display:none}body{margin:0}}</style></head><body><div class="head"><img src="/branding/logo.png" alt=""><strong>${escape(applicationName)}</strong></div><h1>Transaction receipt</h1><p>This receipt records the ${escape(receipt.status)} status. Approval alone does not confirm settlement.</p><dl>${rows.map(([label, value]) => `<dt>${escape(label)}</dt><dd>${escape(value)}</dd>`).join("")}</dl><footer>For help, use the support center in your secure account.</footer><button onclick="window.print()">Print or save as PDF</button></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'", "Cache-Control": "private, no-store" } });
} catch (error) { return respondError(error); } }
