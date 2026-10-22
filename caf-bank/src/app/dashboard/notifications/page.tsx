"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
type Notification = { _id: string; type: string; title: string; href: string; createdAt: string; readAt?: string };

export default function NotificationsPage() {
  const t = useTranslations("notificationsPage");
  const common = useTranslations("common");
  const notice = useTranslations("notice");
  const locale = useLocale();
  const [items, setItems] = useState<Notification[]>([]);
  async function load() { setItems(await fetch("/api/notifications").then(response => response.json())); }
  useEffect(() => { void load(); }, []);
  async function read(id: string) { await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); await load(); }
  function title(item: Notification) { return item.type === "VERIFICATION_REQUIRED" ? notice("verificationRequired") : item.type === "VERIFICATION_SUCCESS" ? notice("verificationSuccess") : item.type === "TRANSFER_SUCCESS" ? notice("transferSuccess") : item.title; }
  return <><span className="eyebrow">{t("eyebrow")}</span><h1 className="text-3xl font-bold mt-1">{common("notifications")}</h1><div className="card divide-y mt-7">{items.length ? items.map(item => <div key={item._id} className="p-5 flex justify-between gap-4"><div><Link href={item.href || "/dashboard"} className="font-bold text-blue-700">{title(item)}</Link><p className="muted text-sm mt-1">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</p></div>{!item.readAt && <button onClick={() => read(item._id)} className="text-blue-700 font-semibold">{t("markRead")}</button>}</div>) : <p className="p-6 muted">{t("empty")}</p>}</div></>;
}
