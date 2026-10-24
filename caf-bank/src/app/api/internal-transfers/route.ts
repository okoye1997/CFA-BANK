import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Account } from "@/lib/models";
import { AppError, respondError } from "@/lib/http";
import { internalTransfer, quoteInternalTransfer } from "@/services/internal-transfer.service";

export async function GET(request: Request) { try {
  const user = await currentUser();
  const q = new URL(request.url).searchParams;
  const amount = Number(q.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100) throw new AppError("Invalid amount.", 422);
  const [source, destination] = await Promise.all([
    Account.findOne({ _id: q.get("source"), userId: user._id, status: "ACTIVE" }),
    Account.findOne({ _id: q.get("destination"), userId: user._id, status: "ACTIVE" }),
  ]);
  if (!source || !destination || String(source._id) === String(destination._id)) throw new AppError("Invalid accounts.", 422);
  return NextResponse.json(quoteInternalTransfer(source.currency, destination.currency, Math.round(amount * 100)));
} catch (error) { return respondError(error); } }

export async function POST(request: Request) { try {
  const user = await currentUser();
  return NextResponse.json(await internalTransfer(String(user._id), await request.json()));
} catch (error) { return respondError(error); } }
