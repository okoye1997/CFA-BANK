"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { io } from "socket.io-client";

type Customer = { firstName: string; surname: string; email: string };
type Conversation = { _id: string; subject: string; status: string; userId: string | Customer; transactionReference?: string; lastMessageAt: string; unreadCount?: number };
type SupportMessage = { _id: string; body: string; senderRole: string; createdAt: string; readAt?: string };
const queues = ["All", "Open", "Waiting", "Assigned", "Resolved"] as const;
const statuses = ["OPEN", "ASSIGNED", "WAITING_FOR_USER", "WAITING_FOR_SUPPORT", "RESOLVED", "CLOSED"] as const;

export function SupportChat({ admin = false }: { admin?: boolean }) {
  const t = useTranslations("chat");
  const common = useTranslations("common");
  const state = useTranslations("status");
  const locale = useLocale();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [subject, setSubject] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [body, setBody] = useState("");
  const [queue, setQueue] = useState<(typeof queues)[number]>("All");
  const [connection, setConnection] = useState<"connected" | "connecting" | "offline">("connecting");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch(admin ? "/api/admin/support" : "/api/support/conversations");
    if (response.ok) setConversations(await response.json());
  }, [admin]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!selected) return;
    const refresh = async () => {
      const response = await fetch(`/api/support/messages?conversationId=${selected._id}`);
      if (response.ok) { setMessages(await response.json()); await load(); }
    };
    void refresh();
    const socket = io({ path: "/socket.io", transports: ["websocket", "polling"] });
    socket.on("connect", () => { setConnection("connected"); socket.emit("support:join", selected._id); });
    socket.on("connect_error", () => setConnection("offline"));
    socket.on("disconnect", () => setConnection("offline"));
    socket.on("support:message", refresh);
    const timer = setInterval(refresh, 10000);
    return () => { socket.disconnect(); clearInterval(timer); };
  }, [selected, load]);
  async function start(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/support/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, transactionReference: transactionReference.trim().toUpperCase() }) });
      if (!response.ok) { setError((await response.json()).error); return; }
      const conversation = await response.json();
      setSubject(""); setTransactionReference(""); await load(); setSelected(conversation);
    } finally { setBusy(false); }
  }
  async function send(event: React.FormEvent) {
    event.preventDefault(); if (!selected) return; setBusy(true); setError("");
    try {
      const response = await fetch("/api/support/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected._id, body }) });
      if (!response.ok) { setError((await response.json()).error); return; }
      setBody("");
      setMessages(await fetch(`/api/support/messages?conversationId=${selected._id}`).then(result => result.json()));
    } finally { setBusy(false); }
  }
  async function setStatus(status: string) {
    if (!selected) return;
    const response = await fetch("/api/admin/support", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected._id, status }) });
    if (!response.ok) { setError((await response.json()).error); return; }
    setSelected({ ...selected, status }); await load();
  }
  const matchesQueue = (conversation: Conversation, item: (typeof queues)[number]) => item === "All" || (item === "Waiting" ? conversation.status.startsWith("WAITING") : item === "Resolved" ? ["RESOLVED", "CLOSED"].includes(conversation.status) : conversation.status === item.toUpperCase());
  const filtered = conversations.filter(conversation => matchesQueue(conversation, queue));
  const customer = selected && typeof selected.userId === "object" ? selected.userId : null;
  const translatedStatus = (value: string) => statuses.includes(value as typeof statuses[number]) ? state(value as typeof statuses[number]) : value;
  return <>
    <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900 mb-5">{t("safety")}</div>
    {error && <p className="error mb-4">{error}</p>}
    {admin && <div className="flex flex-wrap gap-2 mb-5">{queues.map(item => <button key={item} onClick={() => setQueue(item)} className={`rounded-full px-4 py-2 text-sm font-bold ${queue === item ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`}>{t(item.toLowerCase())} ({new Intl.NumberFormat(locale).format(conversations.filter(conversation => matchesQueue(conversation, item)).length)})</button>)}</div>}
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-5"><div className="card p-4 min-w-0"><h2 className="font-bold text-lg px-2 mb-3">{t("conversations")}</h2>
      {!admin && <form onSubmit={start} className="grid gap-2 mb-4"><input className="control" aria-label={t("subject")} placeholder={t("subject")} value={subject} onChange={event => setSubject(event.target.value)} required/><input className="control" aria-label={t("transactionReference")} placeholder={t("transactionReference")} value={transactionReference} onChange={event => setTransactionReference(event.target.value)}/><button disabled={busy} className="btn">{t("start")}</button></form>}
      <div className="divide-y max-h-[500px] overflow-auto">{filtered.map(conversation => <button key={conversation._id} onClick={() => setSelected(conversation)} className={`w-full text-left p-3 hover:bg-blue-50 rounded-lg ${selected?._id === conversation._id ? "bg-blue-50" : ""}`}><div className="flex justify-between gap-2"><b className="truncate">{conversation.subject}</b>{Boolean(conversation.unreadCount) && <span className="status">{conversation.unreadCount}</span>}</div><p className="muted text-xs mt-1">{translatedStatus(conversation.status)}</p>{admin && typeof conversation.userId === "object" && <p className="text-xs mt-1">{conversation.userId.firstName} {conversation.userId.surname}</p>}</button>)}{!filtered.length && <p className="muted p-3">{t("empty")}</p>}</div>
    </div><div className="card flex flex-col min-h-[520px] min-w-0 overflow-hidden">{selected ? <><div className="p-5 border-b flex justify-between gap-3 items-center"><div className="min-w-0"><h2 className="font-bold text-lg break-words">{admin ? selected.subject : t("team")}</h2><p className="muted text-xs">{t(connection)} · {translatedStatus(selected.status)}</p>{admin && customer && <p className="text-sm mt-1">{common("customer")}: {customer.firstName} {customer.surname} · <bdi>{customer.email}</bdi></p>}{selected.transactionReference && <p className="text-xs mt-1">{t("transaction")}: <bdi>{selected.transactionReference}</bdi></p>}</div>{admin && <select className="control !w-auto max-w-[45%]" aria-label={common("status")} value={selected.status} onChange={event => setStatus(event.target.value)}>{statuses.map(value => <option key={value} value={value}>{state(value)}</option>)}</select>}</div><div className="p-5 flex-1 space-y-3 overflow-auto max-h-[430px]">{messages.map(message => <div key={message._id} className={`max-w-[85%] p-3 rounded-xl ${message.senderRole === (admin ? "ADMIN" : "CUSTOMER") ? "ml-auto bg-blue-600 text-white" : "bg-blue-50"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><p className="text-xs opacity-70 mt-2">{new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(message.createdAt))} · {message.readAt ? common("read") : common("sent")}</p></div>)}</div><form onSubmit={send} className="p-4 border-t flex gap-2"><input className="control min-w-0" aria-label={t("type")} placeholder={t("type")} value={body} onChange={event => setBody(event.target.value)} maxLength={2000} required/><button disabled={busy} className="btn">{busy ? t("sending") : t("send")}</button></form></> : <div className="m-auto text-center p-8"><h2 className="font-bold text-xl">{t("team")}</h2><p className="muted mt-2">{t("select")}</p></div>}</div></div>
  </>;
}
