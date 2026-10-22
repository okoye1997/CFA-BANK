import { getLocale, getTranslations } from "next-intl/server";
import { AuditLog } from "@/lib/models";
import { requireAdmin } from "@/lib/auth";
export default async function AuditPage() {
  await requireAdmin();
  const [logs, locale, admin, ui, table, common] = await Promise.all([AuditLog.find().sort({ createdAt: -1 }).limit(100).lean(), getLocale(), getTranslations("admin"), getTranslations("adminScreen"), getTranslations("table"), getTranslations("common")]);
  return <><span className="eyebrow">{admin("administration")}</span><h1 className="text-3xl font-bold mt-1">{admin("audit")}</h1><div className="card table-wrap mt-7"><table className="data-table"><thead><tr><th>{table("date")}</th><th>{common("action")}</th><th>{ui("actor")}</th><th>{ui("entity")}</th></tr></thead><tbody>{logs.length ? logs.map(log => <tr key={String(log._id)}><td>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(log.createdAt))}</td><td>{log.action}</td><td>{String(log.actorId || ui("system"))}</td><td>{String(log.entityId || "—")}</td></tr>) : <tr><td colSpan={4} className="muted">{ui("noAudit")}</td></tr>}</tbody></table></div></>;
}
