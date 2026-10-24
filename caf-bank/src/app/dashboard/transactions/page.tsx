"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/money";
import Link from "next/link";
type Tx = { _id: string; createdAt: string; reference: string; description: string; accountId: string; amount: number; status: string };
type Account = { _id: string; name: string };
const statuses = ["DRAFT", "AWAITING_TRANSACTION_PIN", "AWAITING_ADMIN_AUTHORIZATION", "AUTHORIZED", "PENDING", "VERIFICATION_REQUIRED", "UNDER_REVIEW", "AWAITING_ADMIN_APPROVAL", "APPROVED", "PROCESSING", "COMPLETED", "DECLINED", "FAILED", "CANCELLED"] as const;

export default function TransactionsPage() {
  const t = useTranslations("history");
  const nav = useTranslations("navigation");
  const table = useTranslations("table");
  const state = useTranslations("status");
  const accountLabels = useTranslations("accounts");
  const locale = useLocale();
  const [items, setItems] = useState<Tx[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [account, setAccount] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  useEffect(() => { fetch("/api/accounts").then(response => response.json()).then(setAccounts); }, []);
  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), search, status, account, from, to });
    fetch(`/api/transactions?${query}`).then(response => response.json()).then(data => { setItems(data.items || []); setPages(data.pages || 0); });
  }, [page, search, status, account, from, to]);
  const accountName = (name: string) => name === "Cash Account" ? accountLabels("cash") : name === "Gold Account" ? accountLabels("gold") : name;
  return <><span className="eyebrow">{t("eyebrow")}</span><h1 className="text-3xl font-bold mt-1">{nav("transactions")}</h1><p className="muted mt-2">{t("hint")}</p>
    <div className="card p-5 mt-7 grid sm:grid-cols-2 lg:grid-cols-5 gap-3"><input className="control" aria-label={t("search")} placeholder={t("search")} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }}/><select className="control" aria-label={t("allAccounts")} value={account} onChange={event => { setAccount(event.target.value); setPage(1); }}><option value="">{t("allAccounts")}</option>{accounts.map(item => <option value={item._id} key={item._id}>{accountName(item.name)}</option>)}</select><select className="control" aria-label={t("allStatuses")} value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">{t("allStatuses")}</option>{statuses.map(value => <option key={value} value={value}>{state(value)}</option>)}</select><input aria-label={t("fromDate")} type="date" className="control" value={from} onChange={event => { setFrom(event.target.value); setPage(1); }}/><input aria-label={t("toDate")} type="date" className="control" value={to} onChange={event => { setTo(event.target.value); setPage(1); }}/></div>
    <div className="card table-wrap mt-5"><table className="data-table"><thead><tr><th>{table("date")}</th><th>{table("reference")}</th><th>{table("description")}</th><th>{nav("accounts")}</th><th>{table("amount")}</th><th>{table("status")}</th></tr></thead><tbody>{items.length ? items.map(item => <tr key={item._id}><td>{new Intl.DateTimeFormat(locale).format(new Date(item.createdAt))}</td><td><Link href={`/dashboard/transactions/${item._id}`}>{item.reference}</Link></td><td>{item.description}</td><td>{accountName(accounts.find(accountItem => accountItem._id === item.accountId)?.name || "Cash Account")}</td><td>{formatMoney(item.amount, "USD", locale)}</td><td><span className="status">{["DRAFT", "AWAITING_TRANSACTION_PIN", "AWAITING_ADMIN_AUTHORIZATION", "AUTHORIZED", "PENDING", "COMPLETED", "FAILED", "CANCELLED"].includes(item.status) ? state(item.status as "PENDING") : item.status.replaceAll("_", " ")}</span></td></tr>) : <tr><td colSpan={6} className="muted">{t("empty")}</td></tr>}</tbody></table></div>
    <div className="flex gap-3 items-center justify-end mt-4"><button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t("previous")}</button><span>{t("page", { page, total: Math.max(1, pages) })}</span><button className="btn btn-outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>{t("next")}</button></div>
  </>;
}
