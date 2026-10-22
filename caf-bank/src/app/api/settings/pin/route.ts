import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { setTransactionPin } from "@/services/transfer.service";
import { respondError } from "@/lib/http";
export async function POST(request: Request) { try { const user = await currentUser(); const { pin } = await request.json(); await setTransactionPin(String(user._id), String(pin)); return NextResponse.json({ ok: true }); } catch (error) { return respondError(error); } }
