import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { Beneficiary, Transaction } from "@/lib/models";
import { authorizeAdmin } from "@/services/transfer.service";
import { respondError } from "@/lib/http";
export async function GET() { try { await requireAdmin(); const items = await Transaction.find({ status: "AWAITING_ADMIN_AUTHORIZATION" }).select("reference amount currency description status createdAt userId beneficiaryId").sort({ createdAt: -1 }).lean(); const beneficiaries = await Beneficiary.find({ _id: { $in: items.map(t => t.beneficiaryId) } }).select("name bankName accountIdentifier").lean(); const byId = new Map(beneficiaries.map(b => [String(b._id), b])); return NextResponse.json(items.map(t => ({ ...t, recipient: byId.get(String(t.beneficiaryId)) || null }))); } catch (error) { return respondError(error); } }
export async function POST(request: Request) { try { const admin = await requireAdmin(); const { transactionId, code } = await request.json(); return NextResponse.json(await authorizeAdmin(String(admin._id), String(transactionId), String(code))); } catch (error) { return respondError(error); } }
