import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { listConversations, startConversation } from "@/services/support.service";
import { respondError } from "@/lib/http";
export async function GET() { try { const user = await currentUser(); return NextResponse.json(await listConversations(String(user._id), user.role === "ADMIN")); } catch (error) { return respondError(error); } }
export async function POST(request: Request) { try { const user = await currentUser(); const { subject, transactionReference } = await request.json(); return NextResponse.json(await startConversation(String(user._id), String(subject), transactionReference ? String(transactionReference) : undefined), { status: 201 }); } catch (error) { return respondError(error); } }
