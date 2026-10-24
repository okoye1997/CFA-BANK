"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
type Verification = { _id: string; userId: string; documentType: string; claimedName: string; createdAt: string; reason: string };
export default function AdminVerifications() {
  const [items, setItems] = useState<Verification[]>([]);
  const [error, setError] = useState("");
  const locale = useLocale();
  const admin = useTranslations("admin");
  const ui = useTranslations("adminScreen");
  const common = useTranslations("common");
  async function load() { setItems(await fetch("/api/admin/verifications").then(response => response.json())); }
  useEffect(() => { void load(); }, []);
  async function decide(id: string, approve: boolean) {
    const response = await fetch("/api/admin/verifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, approve }) });
    if (!response.ok) { setError((await response.json()).error); return; }
    await load();
  }
  return <><span className="eyebrow">{ui("queue")}</span><h1 className="text-3xl font-bold mt-1">{admin("verifications")}</h1>{error && <p className="error mt-5">{error}</p>}<div className="card table-wrap mt-7"><table className="data-table"><thead><tr><th>{common("customer")}</th><th>{ui("documentType")}</th><th>{ui("claimedName")}</th><th>{ui("reason")}</th><th>{ui("submitted")}</th><th>{common("actions")}</th></tr></thead><tbody>{items.length ? items.map(item => <tr key={item._id}><td>{item.userId}</td><td>{item.documentType}</td><td>{item.claimedName}</td><td>{item.reason}</td><td>{new Intl.DateTimeFormat(locale).format(new Date(item.createdAt))}</td><td><div className="flex flex-wrap gap-2"><a className="btn btn-outline" href={`/api/admin/verifications/${item._id}/document`} target="_blank" rel="noreferrer">{ui("viewDocument")}</a><button className="btn" onClick={() => decide(item._id, true)}>{ui("approve")}</button><button className="btn btn-outline" onClick={() => decide(item._id, false)}>{ui("reject")}</button></div></td></tr>) : <tr><td colSpan={6} className="muted">{ui("emptyQueue")}</td></tr>}</tbody></table></div></>;
}
