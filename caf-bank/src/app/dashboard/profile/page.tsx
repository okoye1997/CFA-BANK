import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { currentUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await currentUser();
  const t = await getTranslations("profilePage");
  const nav = await getTranslations("navigation");
  const state = await getTranslations("status");
  return <><span className="eyebrow">{t("eyebrow")}</span><h1 className="text-3xl font-bold mt-1">{nav("profile")}</h1><div className="grid md:grid-cols-2 gap-5 mt-7"><section className="card p-7"><h2 className="text-xl font-bold mb-5">{t("personal")}</h2><p><b>{t("fullName")}:</b> {[user.firstName, user.lastName, user.surname].filter(Boolean).join(" ")}</p><p className="mt-3"><b>{t("country")}:</b> {user.country}</p></section><section className="card p-7"><h2 className="text-xl font-bold mb-5">{t("contact")}</h2><p><b>{t("email")}:</b> {user.email}</p><p className="mt-3"><b>{t("phone")}:</b> {user.phoneNumber}</p></section><section className="card p-7"><h2 className="text-xl font-bold mb-5">{t("address")}</h2><p>{user.homeAddress}</p></section><section className="card p-7"><h2 className="text-xl font-bold mb-5">{t("verification")}</h2><p><b>{t("email")}:</b> {user.emailVerified ? t("verified") : state("PENDING")}</p><p className="mt-3"><b>{t("identity")}:</b> {state(user.verificationStatus as "PENDING" | "APPROVED" | "REVIEW_REQUIRED" | "REJECTED")}</p></section><section className="card p-7"><h2 className="text-xl font-bold mb-5">{nav("settings")}</h2><p>{t("pinPrivate")}</p><Link href="/dashboard/settings" className="btn mt-5">{t("securitySettings")}</Link></section><section className="card p-7"><h2 className="text-xl font-bold mb-5">{t("help")}</h2><p>{t("helpHint")}</p><Link href="/dashboard/support" className="btn mt-5">{t("contactSupport")}</Link></section></div></>;
}
