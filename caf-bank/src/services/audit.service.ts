import { AuditLog } from "@/lib/models";
export async function audit(action: string, actorId?: string, entityId?: string, metadata?: Record<string, string>) {
  await AuditLog.create({ action, actorId, entityId, metadata });
}
