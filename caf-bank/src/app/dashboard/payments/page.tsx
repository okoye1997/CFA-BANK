import Link from "next/link";
import { getTranslations } from "next-intl/server";
export default async function PaymentsPage() {
  const t = await getTranslations("paymentsPage");
  const nav = await getTranslations("navigation");
  return <><span className="eyebrow">{nav("payments")}</span><h1 className="text-3xl font-bold mt-1">{nav("payments")}</h1><div className="card p-8 mt-7"><h2 className="text-xl font-bold">{t("title")}</h2><p className="muted mt-2">{t("hint")}</p><Link href="/dashboard/transfers" className="btn mt-5">{t("start")}</Link></div></>;
}
