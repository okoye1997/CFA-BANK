import { NextResponse } from "next/server";
import { verifyEmail } from "@/services/auth.service";
import { respondError } from "@/lib/http";
export async function POST(request: Request) { try { const { email, code, token } = await request.json(); const verified = await verifyEmail(String(email), String(token || code || "")); return NextResponse.json({ ok: true, verified }); } catch (error) { return respondError(error); } }
