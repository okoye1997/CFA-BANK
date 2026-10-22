"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/money";
type Transaction = { _id: string; reference: string; amount: number; description: string; createdAt: string; userId: string; recipient?: { name: string; bankName: string; accountIdentifier: string } };
export default function AdminTransactions() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const locale = useLocale();
  const admin = useTranslations("admin");
  const ui = useTranslations("adminScreen");
  const common = useTranslations("common");
  const table = useTranslations("table");
  async function load() { setItems(await fetch("/api/admin/transactions").then(response => response.json())); }
  useEffect(() => { void load(); }, []);
  async function approve(id: string) {
    setError("");
    const response = await fetch("/api/admin/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactionId: id, code: codes[id] }) });
    if (!response.ok) { setError((await response.json()).error); return; }
    await load();
  }
  return <><span className="eyebrow">{ui("queue")}</span><h1 className="text-3xl font-bold mt-1">{admin("transactions")}</h1><p className="muted mt-2">{ui("authorizationHint")}</p>{error && <p className="error mt-5">{error}</p>}<div className="card table-wrap mt-7"><table className="data-table"><thead><tr><th>{table("reference")}</th><th>{common("customer")}</th><th>{ui("recipient")}</th><th>{table("amount")}</th><th>{table("description")}</th><th>{ui("code")}</th><th>{common("action")}</th></tr></thead><tbody>{items.length ? items.map(item => <tr key={item._id}><td>{item.reference}</td><td>{item.userId}</td><td>{item.recipient ? <>{item.recipient.name} · {item.recipient.bankName} · <bdi>{item.recipient.accountIdentifier}</bdi></> : ui("removedRecipient")}</td><td>{formatMoney(item.amount, "USD", locale)}</td><td>{item.description}</td><td><input className="control" aria-label={ui("code")} inputMode="numeric" maxLength={6} value={codes[item._id] || ""} onChange={event => setCodes({ ...codes, [item._id]: event.target.value })}/></td><td><button className="btn" onClick={() => approve(item._id)}>{ui("authorize")}</button></td></tr>) : <tr><td colSpan={7} className="muted">{ui("emptyQueue")}</td></tr>}</tbody></table></div></>;
}
