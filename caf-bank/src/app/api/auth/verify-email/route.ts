import { NextResponse } from "next/server";
import { verifyEmail } from "@/services/auth.service";
import { respondError } from "@/lib/http";
export async function POST(request: Request) { try { const { email, code } = await request.json(); await verifyEmail(String(email), String(code)); return NextResponse.json({ ok: true }); } catch (error) { return respondError(error); } }
