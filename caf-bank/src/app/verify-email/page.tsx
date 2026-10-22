"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { LanguageSelector } from "@/components/language-selector";

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const t = useTranslations("verify");
  const auth = useTranslations("auth");
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      const response = await fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error); return; }
      const session = await fetch("/api/me");
      setMessage(session.ok ? t("verifiedContinue") : t("verifiedSignIn"));
      router.push(session.ok ? "/identity-verification" : "/auth");
    } finally { setBusy(false); }
  }
  async function resend() {
    const response = await fetch("/api/auth/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setMessage(response.ok ? "If this address is awaiting verification, a new code has been sent." : (await response.json()).error);
  }
  return <main className="min-h-screen flex items-center justify-center p-6"><div className="card p-9 max-w-md w-full"><div className="flex justify-end"><LanguageSelector compact/></div><Link href="/" className="brand"><span className="brand-mark">◈</span>CAF BANK</Link><h1 className="text-3xl font-bold mt-9">{t("title")}</h1><p className="muted mt-2 mb-7">{t("hint")}</p>{message && <p className="status mb-5">{message}</p>}<form onSubmit={submit} className="grid gap-5"><label className="field">{auth("email")}<input type="email" value={email} onChange={event => setEmail(event.target.value)} required/></label><label className="field">{t("code")}<input value={code} onChange={event => setCode(event.target.value)} maxLength={6} inputMode="numeric" pattern="[0-9]{6}" required/></label><button disabled={busy} className="btn">{t("verify")}</button></form><button className="text-blue-700 font-bold mt-6" onClick={resend}>{t("resend")}</button></div></main>;
}
export default function VerifyEmail() { return <Suspense fallback={<main className="p-10">Loading…</main>}><VerifyEmailContent/></Suspense>; }
