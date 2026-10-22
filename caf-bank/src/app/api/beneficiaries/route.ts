import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { Beneficiary } from "@/lib/models";
import { respondError } from "@/lib/http";
const schema = z.object({ name: z.string().trim().min(2), bankName: z.string().trim().min(2), accountIdentifier: z.string().trim().min(3).max(40) });
export async function GET() { try { const user = await currentUser(); return NextResponse.json(await Beneficiary.find({ userId: user._id }).select("name bankName accountIdentifier").lean()); } catch (error) { return respondError(error); } }
export async function POST(request: Request) { try { const user = await currentUser(); const data = schema.parse(await request.json()); const item = await Beneficiary.create({ userId: user._id, ...data, currency: "USD" }); return NextResponse.json(item, { status: 201 }); } catch (error) { return respondError(error); } }
export async function DELETE(request: Request) { try { const user = await currentUser(); const id = new URL(request.url).searchParams.get("id"); await Beneficiary.deleteOne({ _id: id, userId: user._id }); return NextResponse.json({ ok: true }); } catch (error) { return respondError(error); } }
