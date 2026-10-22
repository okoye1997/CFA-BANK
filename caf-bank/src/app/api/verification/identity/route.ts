import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { submitIdentity } from "@/services/verification.service";
import { respondError } from "@/lib/http";
import { Verification } from "@/lib/models";
export async function GET() { try { const user = await currentUser(); const latest = await Verification.findOne({ userId: user._id }).sort({ createdAt: -1 }).select("status reason createdAt").lean(); return NextResponse.json({ status: user.verificationStatus, latest }); } catch (error) { return respondError(error); } }
export async function POST(request: Request) { try { const user = await currentUser(); const form = await request.formData(); const result = await submitIdentity(String(user._id), String(form.get("documentType")), String(form.get("claimedName")), form.get("document") as File); return NextResponse.json(result); } catch (error) { return respondError(error); } }
