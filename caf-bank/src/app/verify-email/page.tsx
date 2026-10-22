"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { LanguageSelector } from "@/components/language-selector";

function VerifyEmailContent() {
  const params = useSearchParams();
  const t = useTranslations("verify");
  const auth = useTranslations("auth");
  const common = useTranslations("common");
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false);
  const [nextHref, setNextHref] = useState("/auth");
  const [busy, setBusy] = useState(false);
  const attemptedToken = useRef(false);
  const verify = useCallback(async (value: string) => {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, ...(value.length === 64 ? { token: value } : { code: value }) }) });
      if (!response.ok) { setMessage(common("requestFailed")); return; }
      const session = await fetch("/api/me");
      setNextHref(session.ok ? "/identity-verification" : "/auth");
      setVerified(true);
      setMessage(t("successBody"));
    } catch { setMessage(common("requestFailed")); }
    finally { setBusy(false); }
  }, [email, common, t]);
  useEffect(() => {
    const token = params.get("token");
    if (token && email && !attemptedToken.current) { attemptedToken.current = true; void verify(token); }
  }, [email, params, verify]);
  async function submit(event: React.FormEvent) { event.preventDefault(); await verify(code); }
  async function resend() {
    try {
      const response = await fetch("/api/auth/resend-verification", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setMessage(response.ok ? t("resendSuccess") : common("requestFailed"));
    } catch { setMessage(common("requestFailed")); }
  }
  return <main className="min-h-screen flex items-center justify-center p-6"><div className="card p-9 max-w-md w-full"><div className="flex justify-end"><LanguageSelector compact/></div><Link href="/" className="brand"><span className="brand-mark">◈</span>CAF BANK</Link>{verified ? <><h1 className="text-3xl font-bold mt-9">{t("successTitle")}</h1><p className="muted mt-3">{message}</p><Link href={nextHref} className="btn mt-7">{nextHref === "/auth" ? t("continueSignIn") : t("continueIdentity")}</Link></> : <><h1 className="text-3xl font-bold mt-9">{t("title")}</h1><p className="muted mt-2 mb-7">{t("hint")}</p>{message && <p className="status mb-5">{message}</p>}<form onSubmit={submit} className="grid gap-5"><label className="field">{auth("email")}<input type="email" value={email} onChange={event => setEmail(event.target.value)} required/></label><label className="field">{t("code")}<input value={code} onChange={event => setCode(event.target.value)} maxLength={6} inputMode="numeric" pattern="[0-9]{6}" required/></label><button disabled={busy} className="btn">{busy ? common("working") : t("verify")}</button></form><button className="text-blue-700 font-bold mt-6" onClick={resend}>{t("resend")}</button></>}</div></main>;
}
export default function VerifyEmail() { return <Suspense fallback={<main className="p-10">Loading...</main>}><VerifyEmailContent/></Suspense>; }
