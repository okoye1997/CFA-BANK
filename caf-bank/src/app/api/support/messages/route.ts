import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { listSupportMessages, sendSupportMessage } from "@/services/support.service";
import { respondError } from "@/lib/http";
export async function GET(request: Request) { try { const user = await currentUser(); const id = new URL(request.url).searchParams.get("conversationId") || ""; return NextResponse.json(await listSupportMessages(id, String(user._id), user.role === "ADMIN")); } catch (error) { return respondError(error); } }
export async function POST(request: Request) { try { const user = await currentUser(); const { conversationId, body } = await request.json(); return NextResponse.json(await sendSupportMessage(String(conversationId), String(user._id), user.role === "ADMIN", String(body)), { status: 201 }); } catch (error) { return respondError(error); } }
