import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { authorizeCustomer } from "@/services/transfer.service";
import { respondError } from "@/lib/http";
export async function POST(request: Request) { try { const user = await currentUser(); const { transactionId, pin } = await request.json(); return NextResponse.json(await authorizeCustomer(String(user._id), String(transactionId), String(pin))); } catch (error) { return respondError(error); } }
