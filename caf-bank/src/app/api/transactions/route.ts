import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Transaction } from "@/lib/models";
import { respondError } from "@/lib/http";
export async function GET(request: Request) { try {
  const user = await currentUser(), q = new URL(request.url).searchParams;
  const filter: Record<string, unknown> = { userId: user._id };
  if (q.get("status")) filter.status = q.get("status");
  if (q.get("account")) filter.accountId = q.get("account");
  if (q.get("search")) { const safe = q.get("search")!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); filter.$or = [{ reference: { $regex: safe, $options: "i" } }, { description: { $regex: safe, $options: "i" } }]; }
  if (q.get("from") || q.get("to")) filter.createdAt = { ...(q.get("from") ? { $gte: new Date(q.get("from")!) } : {}), ...(q.get("to") ? { $lte: new Date(`${q.get("to")}T23:59:59.999Z`) } : {}) };
  const page = Math.max(1, Number(q.get("page")) || 1), limit = 20;
  const [items, total] = await Promise.all([Transaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Transaction.countDocuments(filter)]);
  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) });
} catch (error) { return respondError(error); } }
