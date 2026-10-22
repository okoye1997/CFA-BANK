import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createTransfer } from "@/services/transfer.service";
import { respondError } from "@/lib/http";
import { Transaction } from "@/lib/models";
export async function GET(request: Request) { try { const user = await currentUser(); const id = new URL(request.url).searchParams.get("id"); const transaction = await Transaction.findOne({ _id: id, userId: user._id }).select("reference status").lean(); return NextResponse.json(transaction || { error: "Transaction not found." }, { status: transaction ? 200 : 404 }); } catch (error) { return respondError(error); } }
export async function POST(request: Request) { try { const user = await currentUser(); return NextResponse.json(await createTransfer(String(user._id), await request.json()), { status: 201 }); } catch (error) { return respondError(error); } }
