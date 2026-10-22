import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { User } from "@/lib/models";
import { issueVerificationCode } from "@/services/auth.service";
import { respondError } from "@/lib/http";
export async function POST(request: Request) { try { const { email } = await request.json(); await connectMongo(); const user = await User.findOne({ email: String(email).toLowerCase().trim() }); if (user && !user.emailVerified) await issueVerificationCode(user); return NextResponse.json({ ok: true }); } catch (error) { return respondError(error); } }
