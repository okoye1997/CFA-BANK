import Link from "next/link";
import { getTranslations } from "next-intl/server";
export default async function NotFound() {
  const t = await getTranslations("errorPage");
  return <main className="min-h-screen flex items-center justify-center p-4 sm:p-6"><div className="card p-6 sm:p-10 max-w-md text-center"><span className="eyebrow">404</span><h1 className="text-3xl font-bold mt-3">{t("notFound")}</h1><p className="muted mt-3">{t("notFoundHint")}</p><Link href="/" className="btn mt-6">{t("home")}</Link></div></main>;
}