import { NextResponse } from "next/server";
import { processQueuedEmailJobs } from "@/services/email.service";
import { respondError } from "@/lib/http";
export async function POST(request: Request) { if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); try { return NextResponse.json({ processed: await processQueuedEmailJobs() }); } catch (error) { return respondError(error); } }
