import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { Account } from "@/lib/models";
import { respondError } from "@/lib/http";
export async function GET() { try { const user = await currentUser(); return NextResponse.json(await Account.find({ userId: user._id }).select("name currency availableBalance ledgerBalance status").lean()); } catch (error) { return respondError(error); } }
