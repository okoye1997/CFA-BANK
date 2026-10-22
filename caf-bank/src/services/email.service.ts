import { connectMongo } from "@/lib/mongodb";
import { EmailJob } from "@/lib/models";
import { deliverEmailJob } from "@/lib/email/send-email";
export async function processQueuedEmailJobs() {
  await connectMongo();
  const jobs = await EmailJob.find({ status: "QUEUED" }).sort({ createdAt: 1 }).limit(100).select("_id");
  for (const job of jobs) await deliverEmailJob(String(job._id));
  return jobs.length;
}
