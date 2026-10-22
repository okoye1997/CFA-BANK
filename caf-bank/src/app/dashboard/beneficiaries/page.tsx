"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
type Beneficiary = { _id: string; name: string; bankName: string; accountIdentifier: string };

export default function BeneficiariesPage() {
  const t = useTranslations("beneficiariesPage");
  const nav = useTranslations("navigation");
  const [items, setItems] = useState<Beneficiary[]>([]);
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [error, setError] = useState("");
  async function load() { setItems(await fetch("/api/beneficiaries").then(response => response.json())); }
  useEffect(() => { void load(); }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/beneficiaries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, bankName, accountIdentifier }) });
    if (!response.ok) { setError((await response.json()).error); return; }
    setName(""); setBankName(""); setAccountIdentifier(""); setError(""); await load();
  }
  async function remove(id: string) { await fetch(`/api/beneficiaries?id=${id}`, { method: "DELETE" }); await load(); }
  return <><span className="eyebrow">{t("eyebrow")}</span><h1 className="text-3xl font-bold mt-1">{nav("beneficiaries")}</h1><p className="muted mt-2">{t("hint")}</p><form onSubmit={submit} className="card p-6 mt-7 grid sm:grid-cols-2 gap-4"><h2 className="text-xl font-bold sm:col-span-2">{t("add")}</h2>{error && <p className="error sm:col-span-2">{error}</p>}<label className="field">{t("fullName")}<input value={name} onChange={event => setName(event.target.value)} required/></label><label className="field">{t("bankName")}<input value={bankName} onChange={event => setBankName(event.target.value)} required/></label><label className="field">{t("identifier")}<input value={accountIdentifier} onChange={event => setAccountIdentifier(event.target.value)} required/></label><button className="btn self-end">{t("save")}</button></form><div className="card mt-5 divide-y">{items.length ? items.map(item => <div key={item._id} className="p-5 flex justify-between gap-4"><div><b>{item.name}</b><p className="muted text-sm">{item.bankName} · <bdi>{item.accountIdentifier}</bdi></p></div><button className="text-red-700 font-bold" onClick={() => remove(item._id)}>{t("remove")}</button></div>) : <p className="p-6 muted">{t("empty")}</p>}</div></>;
}
