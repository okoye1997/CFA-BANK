import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { Transaction, User, AuditLog } from "@/lib/models";
import { AppError, respondError } from "@/lib/http";
import { addAdminNote, changeTransactionStatus } from "@/services/transaction-workflow.service";
import mongoose from "mongoose";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { try {
  await requireAdmin(); const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw new AppError("Transaction not found.", 404);
  const transaction = await Transaction.findById(id).lean();
  if (!transaction) throw new AppError("Transaction not found.", 404);
  const [user, audit] = await Promise.all([User.findById(transaction.userId).select("firstName surname email").lean(), AuditLog.find({ entityId: transaction._id }).sort({ createdAt: 1 }).lean()]);
  return NextResponse.json({ transaction, user, audit });
} catch (error) { return respondError(error); } }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try {
  const admin = await requireAdmin(); const { id } = await params;
  const body = await request.json();
  if (typeof body !== "object" || body === null) throw new AppError("Invalid input.", 422);
  if (body.action === "NOTE") {
    if (typeof body.note !== "string") throw new AppError("Invalid note.", 422);
    return NextResponse.json(await addAdminNote(String(admin._id), id, body.note));
  }
  if (body.action !== "STATUS" || typeof body.status !== "string" || (body.note !== undefined && typeof body.note !== "string") || (body.customerReason !== undefined && typeof body.customerReason !== "string")) throw new AppError("Invalid input.", 422);
  return NextResponse.json(await changeTransactionStatus(String(admin._id), id, body.status, body.note, body.customerReason));
} catch (error) { return respondError(error); } }
