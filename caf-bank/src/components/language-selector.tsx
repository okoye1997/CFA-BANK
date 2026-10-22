"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { isAppLocale, localeNames, locales } from "@/i18n/locales";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const current = useLocale();
  const t = useTranslations("language");
  const [busy, setBusy] = useState(false);
  async function change(value: string) {
    if (!isAppLocale(value)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/settings/locale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: value }) });
      if (!response.ok) throw new Error("Language could not be saved.");
      document.documentElement.lang = value;
      document.documentElement.dir = value === "ar" ? "rtl" : "ltr";
      window.location.reload();
    } finally { setBusy(false); }
  }
  return <label className="inline-flex items-center gap-2 text-sm font-semibold"><span>{compact ? "🌐" : `🌐 ${t("label")}`}</span><select aria-label={t("label")} className="rounded-lg border border-blue-200 bg-white text-slate-900 px-2 py-2" value={current} disabled={busy} onChange={(event) => void change(event.target.value)}>{locales.map(locale => <option key={locale} value={locale}>{localeNames[locale]}</option>)}</select></label>;
}
