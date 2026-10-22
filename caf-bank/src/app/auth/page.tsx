"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSelector } from "@/components/language-selector";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema } from "@/lib/validation";
import type { z } from "zod";

type Registration = z.infer<typeof registrationSchema>;
const fieldNames = ["surname", "firstName", "lastName", "email", "password", "country", "homeAddress", "phoneNumber"] as const;

function AuthContent() {
  const params = useSearchParams();
  const router = useRouter();
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const [registerMode, setRegisterMode] = useState(params.get("mode") === "register");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Registration>({ resolver: zodResolver(registrationSchema) });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function create(data: Registration) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      await signIn("credentials", { email: data.email, password: data.password, redirect: false });
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }

  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) { setError(t("incorrectCredentials")); return; }
      const response = await fetch("/api/me");
      if (!response.ok) throw new Error(t("incorrectCredentials"));
      const user = await response.json();
      const cookieLocale = document.cookie.match(/(?:^|; )caf_locale=([^;]+)/)?.[1];
      const locale = cookieLocale || user.preferredLocale;
      if (locale) {
        await fetch("/api/settings/locale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale }) });
      }
      router.push(!user.emailVerified ? `/verify-email?email=${encodeURIComponent(email)}` : !user.identityVerified ? "/identity-verification" : user.role === "ADMIN" ? "/admin" : "/dashboard");
      router.refresh();
    } catch { setError(t("incorrectCredentials")); }
    finally { setBusy(false); }
  }

  const fieldLabels: Record<(typeof fieldNames)[number], string> = { surname: t("surname"), firstName: t("firstName"), lastName: t("lastName"), email: t("email"), password: t("password"), country: t("country"), homeAddress: t("address"), phoneNumber: t("phone") };
  return <main className="min-h-screen grid lg:grid-cols-2">
    <section className="hidden lg:flex bg-[#123d7a] text-white p-16 flex-col justify-between"><Link href="/" className="brand !text-white"><span className="brand-mark !bg-white !text-blue-700">◈</span>CAF BANK</Link><div><span className="text-blue-200 uppercase tracking-widest text-sm font-bold">{t("welcome")}</span><h1 className="text-5xl font-bold leading-tight mt-4">{t("headline")}</h1><p className="text-blue-100 mt-5 max-w-md">{t("description")}</p></div><small>CAF Bank · Banking simulation</small></section>
    <section className="min-w-0 flex items-center justify-center p-4 sm:p-6 md:p-12"><div className="card min-w-0 p-5 sm:p-8 md:p-10 w-full max-w-xl"><div className="flex justify-end mb-5"><LanguageSelector/></div><Link href="/" className="brand lg:hidden mb-8"><span className="brand-mark">◈</span>CAF BANK</Link><span className="eyebrow">{registerMode ? t("getStarted") : t("welcomeBack")}</span><h2 className="text-3xl font-bold mt-2">{registerMode ? t("createAccount") : t("signInTitle")}</h2><p className="muted mt-2 mb-7">{registerMode ? t("registerHint") : t("signInHint")}</p>{error && <p className="error mb-5">{error}</p>}
      {registerMode ? <form onSubmit={handleSubmit(create)} className="grid sm:grid-cols-2 gap-4">{fieldNames.map(name => <label className={`field ${name === "homeAddress" ? "sm:col-span-2" : ""}`} key={name}>{fieldLabels[name]}<input type={name === "email" ? "email" : name === "password" ? "password" : name === "phoneNumber" ? "tel" : "text"} {...register(name)} autoComplete={name === "password" ? "new-password" : undefined}/>{errors[name] && <span className="text-red-600 text-xs">{t("invalidField")}</span>}</label>)}<button disabled={busy} className="btn sm:col-span-2 mt-2">{busy ? t("creating") : common("createAccount")}</button></form> : <form onSubmit={login} className="grid gap-5"><label className="field">{t("email")}<input type="email" value={email} onChange={event => setEmail(event.target.value)} required/></label><label className="field">{t("password")}<input type="password" value={password} onChange={event => setPassword(event.target.value)} required/></label><button disabled={busy} className="btn">{busy ? t("signingIn") : common("signIn")}</button></form>}
      <p className="text-center mt-7 muted">{registerMode ? t("alreadyHaveAccount") : t("newToBank")} <button className="text-blue-700 font-bold" onClick={() => { setRegisterMode(!registerMode); setError(""); }}>{registerMode ? common("signIn") : common("createAccount")}</button></p>
    </div></section>
  </main>;
}
export default function AuthPage() { return <Suspense fallback={<main className="p-10">Loading…</main>}><AuthContent/></Suspense>; }
