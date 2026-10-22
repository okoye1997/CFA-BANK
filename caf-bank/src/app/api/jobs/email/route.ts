import { NextResponse } from "next/server";
import { processQueuedEmailJobs } from "@/services/email.service";
import { processCompletedTransferNotifications } from "@/services/transaction.service";
import { respondError } from "@/lib/http";
export async function POST(request: Request) { if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); try { const completedAlerts = await processCompletedTransferNotifications(); const processed = await processQueuedEmailJobs(); return NextResponse.json({ processed, completedAlerts }); } catch (error) { return respondError(error); } }
