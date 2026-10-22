import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { Verification } from "@/lib/models";
import { approveIdentity } from "@/services/verification.service";
import { respondError } from "@/lib/http";
export async function GET() { try { await requireAdmin(); return NextResponse.json(await Verification.find({ status: "REVIEW_REQUIRED" }).select("-documentPath").sort({ createdAt: -1 }).lean()); } catch (error) { return respondError(error); } }
export async function POST(request: Request) { try { const admin = await requireAdmin(); const { id, approve } = await request.json(); await approveIdentity(String(admin._id), String(id), approve === true); return NextResponse.json({ ok: true }); } catch (error) { return respondError(error); } }
