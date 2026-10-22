import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Transaction, Verification, SupportConversation } from "@/lib/models";
import { requireAdmin } from "@/lib/auth";
export default async function AdminPage() {
  await requireAdmin();
  const [verifications, transactions, support, t, ui, locale] = await Promise.all([Verification.countDocuments({ status: "REVIEW_REQUIRED" }), Transaction.countDocuments({ status: "AWAITING_ADMIN_AUTHORIZATION" }), SupportConversation.countDocuments({ status: { $nin: ["CLOSED", "RESOLVED"] } }), getTranslations("admin"), getTranslations("adminScreen"), getLocale()]);
  return <><span className="eyebrow">{t("administration")}</span><h1 className="text-3xl font-bold mt-1">{t("overview")}</h1><div className="grid md:grid-cols-3 gap-5 mt-7">{[[t("verifications"), verifications, "/admin/verifications"], [t("transactions"), transactions, "/admin/transactions"], [t("support"), support, "/admin/support"]].map(([title, count, href]) => <Link href={href as string} key={title as string} className="card p-7 hover:border-blue-300"><p className="muted">{title}</p><p className="text-4xl font-bold mt-5">{new Intl.NumberFormat(locale).format(Number(count))}</p><p className="text-blue-700 font-semibold mt-4">{ui("openQueue")}</p></Link>)}</div></>;
}
