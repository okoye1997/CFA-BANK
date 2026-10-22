"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/money";
type Message = { _id: string; subject: string; body: string; type: string; details?: Record<string, string>; createdAt: string; readAt?: string };

export default function MessagesPage() {
  const t = useTranslations("messagesPage");
  const notice = useTranslations("notice");
  const locale = useLocale();
  const [items, setItems] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Message | null>(null);
  const load = useCallback(async () => { setItems(await fetch(`/api/messages?search=${encodeURIComponent(search)}`).then(response => response.json())); }, [search]);
  useEffect(() => { void load(); }, [load]);
  async function act(id: string, action: string) {
    await fetch("/api/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    await load(); if (action === "archive") setSelected(null);
  }
  async function open(message: Message) { setSelected(message); if (!message.readAt) await act(message._id, "read"); }
  function subject(message: Message) { return message.type === "VERIFICATION_REQUIRED" ? notice("verificationRequired") : message.type === "VERIFICATION_SUCCESS" ? notice("verificationSuccess") : message.type === "TRANSFER_SUCCESS" ? notice("transferSuccess") : message.subject; }
  function body(message: Message) {
    if (message.type === "VERIFICATION_REQUIRED") return notice("verificationRequiredBody");
    if (message.type === "VERIFICATION_SUCCESS") return notice("verificationSuccessBody");
    const details = message.details;
    if (message.type === "TRANSFER_SUCCESS" && details?.amount && details.currency === "USD" && details.recipient && details.reference && details.date) {
      return notice("transferSuccessBody", { amount: formatMoney(Number(details.amount), "USD", locale), recipient: details.recipient, reference: details.reference, date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(details.date)) });
    }
    return message.body;
  }
  return <><span className="eyebrow">{t("eyebrow")}</span><h1 className="text-3xl font-bold mt-1">{t("inbox")}</h1><div className="grid lg:grid-cols-[350px_1fr] gap-5 mt-7"><div className="card p-4"><input className="control" aria-label={t("search")} placeholder={t("search")} value={search} onChange={event => setSearch(event.target.value)}/><div className="mt-3 divide-y">{items.length ? items.map(message => <button key={message._id} onClick={() => open(message)} className={`w-full text-left p-4 hover:bg-blue-50 rounded-lg ${!message.readAt ? "font-bold" : ""}`}><div className="flex justify-between gap-2"><span>{subject(message)}</span>{!message.readAt && <span className="w-2 h-2 bg-blue-600 rounded-full"/>}</div><p className="muted text-sm mt-1">{new Intl.DateTimeFormat(locale).format(new Date(message.createdAt))}</p></button>) : <p className="p-4 muted">{t("empty")}</p>}</div></div><div className="card p-7 min-h-80">{selected ? <><div className="flex justify-between gap-4"><div><span className="eyebrow">{selected.type}</span><h2 className="text-2xl font-bold mt-2">{subject(selected)}</h2><p className="muted text-sm mt-2">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(selected.createdAt))}</p></div><button className="text-blue-700 font-bold" onClick={() => act(selected._id, "archive")}>{t("archive")}</button></div><p className="whitespace-pre-line mt-8 leading-relaxed">{body(selected)}</p></> : <p className="muted">{t("select")}</p>}</div></div></>;
}
