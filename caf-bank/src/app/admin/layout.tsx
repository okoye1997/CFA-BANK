import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { LanguageSelector } from "@/components/language-selector";
export const dynamic = "force-dynamic";
const links = [["overview", "/admin"], ["verifications", "/admin/verifications"], ["transactions", "/admin/transactions"], ["support", "/admin/support"], ["audit", "/admin/audit"]] as const;
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try { await requireAdmin(); } catch { redirect("/auth"); }
  const t = await getTranslations("admin");
  return <div className="min-h-screen lg:flex"><aside className="lg:w-64 bg-[#102f5b] text-white p-5"><Link href="/" className="brand !text-white"><span className="brand-mark">◈</span>CAF BANK</Link><p className="text-blue-200 text-xs uppercase tracking-widest mt-7 mb-3">{t("administration")}</p><nav className="flex lg:flex-col gap-1 overflow-auto">{links.map(([key, href]) => <Link className="p-3 rounded-lg hover:bg-white/10 whitespace-nowrap" href={href} key={href}>{t(key)}</Link>)}<SignOutButton/></nav><div className="mt-5"><LanguageSelector compact/></div></aside><main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto">{children}</main></div>;
}
