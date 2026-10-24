"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/money";
import Link from "next/link";
type Transaction = { _id: string; reference: string; amount: number; description: string; createdAt: string; userId: string; status: string; recipient?: { name: string; bankName: string; accountIdentifier: string } };
export default function AdminTransactions() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const locale = useLocale();
  const admin = useTranslations("admin");
  const ui = useTranslations("adminScreen");
  const common = useTranslations("common");
  const table = useTranslations("table");
  const load = useCallback(async () => { setItems(await fetch(`/api/admin/transactions?${new URLSearchParams({ search, status })}`).then(response => response.json())); }, [search, status]);
  useEffect(() => { void load(); }, [load]);
  async function approve(id: string) {
    setError("");
    const response = await fetch("/api/admin/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactionId: id, code: codes[id] }) });
    if (!response.ok) { setError((await response.json()).error); return; }
    await load();
  }
  return <><span className="eyebrow">{ui("queue")}</span><h1 className="text-3xl font-bold mt-1">{admin("transactions")}</h1><p className="muted mt-2">{ui("authorizationHint")}</p><div className="grid sm:grid-cols-2 gap-3 mt-5"><input className="control" aria-label="Search reference" placeholder="Search reference" value={search} onChange={e => setSearch(e.target.value)}/><select className="control" aria-label="Filter status" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{["AWAITING_ADMIN_AUTHORIZATION", "PENDING", "UNDER_REVIEW", "VERIFICATION_REQUIRED", "AWAITING_ADMIN_APPROVAL", "APPROVED", "PROCESSING", "COMPLETED", "DECLINED", "FAILED"].map(value => <option key={value}>{value}</option>)}</select></div>{error && <p className="error mt-5">{error}</p>}<div className="card table-wrap mt-7"><table className="data-table"><thead><tr><th>{table("reference")}</th><th>{common("customer")}</th><th>{ui("recipient")}</th><th>{table("amount")}</th><th>Status</th><th>{ui("code")}</th><th>{common("action")}</th></tr></thead><tbody>{items.length ? items.map(item => <tr key={item._id}><td><Link href={`/admin/transactions/${item._id}`}>{item.reference}</Link></td><td>{item.userId}</td><td>{item.recipient?.name || ui("removedRecipient")}</td><td>{formatMoney(item.amount, "USD", locale)}</td><td>{item.status}</td><td>{item.status === "AWAITING_ADMIN_AUTHORIZATION" && <input className="control" aria-label={ui("code")} inputMode="numeric" maxLength={6} value={codes[item._id] || ""} onChange={event => setCodes({ ...codes, [item._id]: event.target.value })}/>}</td><td>{item.status === "AWAITING_ADMIN_AUTHORIZATION" ? <button className="btn" onClick={() => approve(item._id)}>{ui("authorize")}</button> : <Link className="btn btn-outline" href={`/admin/transactions/${item._id}`}>Review</Link>}</td></tr>) : <tr><td colSpan={7} className="muted">{ui("emptyQueue")}</td></tr>}</tbody></table></div></>;
}
