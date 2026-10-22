import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Message } from "@/lib/models";
import { respondError } from "@/lib/http";
export async function GET(request: Request) { try { const user = await currentUser(), q = new URL(request.url).searchParams; const filter: Record<string, unknown> = { userId: user._id, archivedAt: null }; if (q.get("search")) filter.subject = { $regex: q.get("search")!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }; return NextResponse.json(await Message.find(filter).sort({ createdAt: -1 }).limit(100).lean()); } catch (error) { return respondError(error); } }
export async function PATCH(request: Request) { try { const user = await currentUser(); const { id, action } = await request.json(); if (!["read", "archive"].includes(action)) return NextResponse.json({ error: "Invalid action." }, { status: 422 }); await Message.updateOne({ _id: id, userId: user._id }, { $set: action === "read" ? { readAt: new Date() } : { archivedAt: new Date() } }); return NextResponse.json({ ok: true }); } catch (error) { return respondError(error); } }
