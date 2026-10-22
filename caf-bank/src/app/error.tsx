"use client";
import { useTranslations } from "next-intl";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errorPage");
  return <main className="min-h-screen flex items-center justify-center p-4 sm:p-6"><div className="card p-6 sm:p-10 max-w-md text-center"><span className="eyebrow">{t("eyebrow")}</span><h1 className="text-3xl font-bold mt-3">{t("title")}</h1><p className="muted mt-3">{t("hint")}</p><button className="btn mt-6" onClick={reset}>{t("retry")}</button></div></main>;
}