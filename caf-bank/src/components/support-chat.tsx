"use client";
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";

type Customer = { firstName: string; surname: string; email: string };
type Conversation = { _id: string; subject: string; status: string; userId: string | Customer; transactionReference?: string; lastMessageAt: string; unreadCount?: number };
type SupportMessage = { _id: string; body: string; senderRole: string; createdAt: string; readAt?: string };
const queues = ["All", "Open", "Waiting", "Assigned", "Resolved"];

export function SupportChat({ admin = false }: { admin?: boolean }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [subject, setSubject] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [body, setBody] = useState("");
  const [queue, setQueue] = useState("All");
  const [connection, setConnection] = useState("Connecting");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch(admin ? "/api/admin/support" : "/api/support/conversations");
    if (response.ok) setConversations(await response.json());
  }, [admin]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!selected) return;
    const refresh = async () => {
      const response = await fetch(`/api/support/messages?conversationId=${selected._id}`);
      if (response.ok) { setMessages(await response.json()); load(); }
    };
    refresh();
    const socket = io({ path: "/socket.io", transports: ["websocket", "polling"] });
    socket.on("connect", () => { setConnection("Connected"); socket.emit("support:join", selected._id); });
    socket.on("connect_error", () => setConnection("Offline · syncing"));
    socket.on("disconnect", () => setConnection("Offline · syncing"));
    socket.on("support:message", refresh);
    const timer = setInterval(refresh, 10000);
    return () => { socket.disconnect(); clearInterval(timer); };
  }, [selected, load]);
  async function start(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/support/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, transactionReference: transactionReference.trim().toUpperCase() }) });
    setBusy(false);
    if (!response.ok) { setError((await response.json()).error); return; }
    const conversation = await response.json();
    setSubject(""); setTransactionReference(""); await load(); setSelected(conversation);
  }
  async function send(event: React.FormEvent) {
    event.preventDefault(); if (!selected) return; setBusy(true); setError("");
    const response = await fetch("/api/support/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected._id, body }) });
    setBusy(false);
    if (!response.ok) { setError((await response.json()).error); return; }
    setBody("");
    setMessages(await fetch(`/api/support/messages?conversationId=${selected._id}`).then(r => r.json()));
  }
  async function setStatus(status: string) {
    if (!selected) return;
    const response = await fetch("/api/admin/support", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected._id, status }) });
    if (!response.ok) { setError((await response.json()).error); return; }
    setSelected({ ...selected, status }); await load();
  }
  const filtered = conversations.filter(c => queue === "All" || (queue === "Waiting" ? c.status.startsWith("WAITING") : queue === "Resolved" ? ["RESOLVED", "CLOSED"].includes(c.status) : c.status === queue.toUpperCase()));
  const customer = selected && typeof selected.userId === "object" ? selected.userId : null;
  return <>
    <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900 mb-5">For your security, never share your password, verification codes or transaction PIN in support chat.</div>
    {error && <p className="error mb-4">{error}</p>}
    {admin && <div className="flex flex-wrap gap-2 mb-5">{queues.map(item => <button key={item} onClick={() => setQueue(item)} className={`rounded-full px-4 py-2 text-sm font-bold ${queue === item ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`}>{item} ({conversations.filter(c => item === "All" || (item === "Waiting" ? c.status.startsWith("WAITING") : item === "Resolved" ? ["RESOLVED", "CLOSED"].includes(c.status) : c.status === item.toUpperCase())).length})</button>)}</div>}
    <div className="grid lg:grid-cols-[300px_1fr] gap-5"><div className="card p-4"><h2 className="font-bold text-lg px-2 mb-3">Conversations</h2>
      {!admin && <form onSubmit={start} className="grid gap-2 mb-4"><input className="control" placeholder="What can we help with?" value={subject} onChange={e => setSubject(e.target.value)} required/><input className="control" placeholder="Transaction reference (optional)" value={transactionReference} onChange={e => setTransactionReference(e.target.value)}/><button disabled={busy} className="btn">Start conversation</button></form>}
      <div className="divide-y max-h-[500px] overflow-auto">{filtered.map(c => <button key={c._id} onClick={() => setSelected(c)} className={`w-full text-left p-3 hover:bg-blue-50 rounded-lg ${selected?._id === c._id ? "bg-blue-50" : ""}`}><div className="flex justify-between gap-2"><b>{c.subject}</b>{Boolean(c.unreadCount) && <span className="status">{c.unreadCount}</span>}</div><p className="muted text-xs mt-1">{c.status.replaceAll("_", " ")}</p>{admin && typeof c.userId === "object" && <p className="text-xs mt-1">{c.userId.firstName} {c.userId.surname}</p>}</button>)}{!filtered.length && <p className="muted p-3">No conversations here.</p>}</div>
    </div><div className="card flex flex-col min-h-[520px] overflow-hidden">{selected ? <><div className="p-5 border-b flex justify-between gap-3 items-center"><div><h2 className="font-bold text-lg">{admin ? selected.subject : "Support Team"}</h2><p className="muted text-xs">{connection} · {selected.status.replaceAll("_", " ")}</p>{admin && customer && <p className="text-sm mt-1">Customer: {customer.firstName} {customer.surname} · {customer.email}</p>}{selected.transactionReference && <p className="text-xs mt-1">Transaction: {selected.transactionReference}</p>}</div>{admin && <select className="control !w-auto" value={selected.status} onChange={e => setStatus(e.target.value)}><option>OPEN</option><option>ASSIGNED</option><option>WAITING_FOR_USER</option><option>WAITING_FOR_SUPPORT</option><option>RESOLVED</option><option>CLOSED</option></select>}</div><div className="p-5 flex-1 space-y-3 overflow-auto max-h-[430px]">{messages.map(m => <div key={m._id} className={`max-w-[85%] p-3 rounded-xl ${m.senderRole === (admin ? "ADMIN" : "CUSTOMER") ? "ml-auto bg-blue-600 text-white" : "bg-blue-50"}`}><p className="whitespace-pre-wrap">{m.body}</p><p className="text-xs opacity-70 mt-2">{new Date(m.createdAt).toLocaleString()} · {m.readAt ? "Read" : "Sent"}</p></div>)}</div><form onSubmit={send} className="p-4 border-t flex gap-2"><input className="control" placeholder="Type your message" value={body} onChange={e => setBody(e.target.value)} maxLength={2000} required/><button disabled={busy} className="btn">{busy ? "Sending…" : "Send"}</button></form></> : <div className="m-auto text-center p-8"><h2 className="font-bold text-xl">Support Team</h2><p className="muted mt-2">Select or start a conversation.</p></div>}</div></div>
  </>;
}
