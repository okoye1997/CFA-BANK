import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listConversations, updateConversation } from "@/services/support.service";
import { respondError } from "@/lib/http";
export async function GET() { try { const admin = await requireAdmin(); return NextResponse.json(await listConversations(String(admin._id), true)); } catch (error) { return respondError(error); } }
export async function PATCH(request: Request) { try { const admin = await requireAdmin(); const { id, status } = await request.json(); return NextResponse.json(await updateConversation(String(id), String(admin._id), String(status), status === "ASSIGNED" ? String(admin._id) : undefined)); } catch (error) { return respondError(error); } }
