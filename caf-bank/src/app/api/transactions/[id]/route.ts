import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { currentUser } from "@/lib/auth";
import { AppError, respondError } from "@/lib/http";
import { Transaction, Receipt } from "@/lib/models";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { try {
  const user = await currentUser(); const { id } = await params;
  if (!mongoose.isValidObjectId(id)) throw new AppError("Transaction not found.", 404);
  const transaction = await Transaction.findOne({ _id: id, userId: user._id }).select("-adminNotes -declineReason -approvedBy -declinedBy -statusHistory.changedBy").lean();
  if (!transaction) throw new AppError("Transaction not found.", 404);
  const receipt = await Receipt.findOne({ transactionId: id, userId: user._id }).sort({ issuedAt: -1 }).select("number status").lean();
  return NextResponse.json({ transaction, receipt });
} catch (error) { return respondError(error); } }
