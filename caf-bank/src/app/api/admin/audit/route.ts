import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { AuditLog } from "@/lib/models";
import { respondError } from "@/lib/http";
export async function GET() { try { await requireAdmin(); return NextResponse.json(await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean()); } catch (error) { return respondError(error); } }
