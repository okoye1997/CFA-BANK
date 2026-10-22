import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Notification } from "@/lib/models";
import { respondError } from "@/lib/http";
export async function GET() { try { const user = await currentUser(); return NextResponse.json(await Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(30).lean()); } catch (error) { return respondError(error); } }
export async function PATCH(request: Request) { try { const user = await currentUser(); const { id } = await request.json(); await Notification.updateOne({ _id: id, userId: user._id }, { $set: { readAt: new Date() } }); return NextResponse.json({ ok: true }); } catch (error) { return respondError(error); } }
