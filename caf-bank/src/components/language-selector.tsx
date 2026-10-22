"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe2 } from "lucide-react";
import { isAppLocale, localeNames, locales } from "@/i18n/locales";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const current = useLocale();
  const t = useTranslations("language");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function change(value: string) {
    if (!isAppLocale(value)) return;
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/settings/locale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: value }) });
      if (!response.ok) throw new Error("locale-save-failed");
      document.documentElement.lang = value;
      document.documentElement.dir = value === "ar" ? "rtl" : "ltr";
      window.location.reload();
    } catch { setFailed(true); } finally { setBusy(false); }
  }
  return <span className="inline-flex flex-col min-w-0"><label className="inline-flex items-center gap-2 text-sm font-semibold"><Globe2 size={18} aria-hidden="true" className="shrink-0"/><span className={compact ? "sr-only" : ""}>{t("label")}</span><select aria-label={t("label")} className="min-w-0 max-w-[150px] rounded-lg border border-blue-200 bg-white text-slate-900 px-2 py-2" value={current} disabled={busy} onChange={(event) => void change(event.target.value)}>{locales.map(locale => <option key={locale} value={locale}>{localeNames[locale]}</option>)}</select></label>{failed && <span role="alert" className="text-red-700 text-xs">{t("saveFailed")}</span>}</span>;
}
