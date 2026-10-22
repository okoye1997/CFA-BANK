import { NextResponse } from "next/server";
import { sendPendingFollowups } from "@/services/transaction.service";
export async function POST(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ processed: await sendPendingFollowups() });
}
