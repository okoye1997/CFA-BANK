import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { LanguageSelector } from "@/components/language-selector";
import { MobileNavigation } from "@/components/mobile-navigation";
export const dynamic = "force-dynamic";
const links = [["overview", "/admin"], ["verifications", "/admin/verifications"], ["transactions", "/admin/transactions"], ["support", "/admin/support"], ["audit", "/admin/audit"]] as const;
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try { await requireAdmin(); } catch { redirect("/auth"); }
  const t = await getTranslations("admin");
  return <div className="min-h-dvh lg:flex"><aside className="hidden lg:block lg:w-64 lg:shrink-0 bg-[#102f5b] text-white p-4 sm:p-5"><Link href="/" className="brand !text-white"><span className="brand-mark">◈</span>CAF BANK</Link><p className="text-blue-200 text-xs uppercase tracking-widest mt-7 mb-3">{t("administration")}</p><nav className="flex flex-col gap-1">{links.map(([key, href]) => <Link className="p-3 rounded-lg hover:bg-white/10 whitespace-nowrap" href={href} key={href}>{t(key)}</Link>)}<SignOutButton/></nav><div className="mt-5"><LanguageSelector compact/></div></aside><div className="flex-1 min-w-0"><MobileNavigation admin links={links.map(([key, href]) => ({ label: t(key), href }))}/><main className="min-w-0 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">{children}</main></div></div>;
}
