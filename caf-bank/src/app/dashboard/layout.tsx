import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { currentUser } from "@/lib/auth";
import { Message, Notification, SupportConversation, SupportMessage } from "@/lib/models";
import { Search } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { HeaderBadges } from "@/components/header-badges";
import { LanguageSelector } from "@/components/language-selector";
import { MobileNavigation } from "@/components/mobile-navigation";
export const dynamic = "force-dynamic";
const nav = ["overview", "accounts", "payments", "transfers", "transactions", "statements", "beneficiaries", "messages", "support", "profile", "settings"] as const;
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user; try { user = await currentUser(); } catch { redirect("/auth"); }
  if (!user.emailVerified) redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  if (!user.identityVerified) redirect("/identity-verification");
  const t = await getTranslations("navigation");
  const common = await getTranslations("common");
  const conversationIds = await SupportConversation.find({ userId: user._id }).distinct("_id");
  const [unreadMessages, unreadNotifications, unreadSupport] = await Promise.all([Message.countDocuments({ userId: user._id, readAt: null, archivedAt: null }), Notification.countDocuments({ userId: user._id, readAt: null }), SupportMessage.countDocuments({ conversationId: { $in: conversationIds }, senderRole: "ADMIN", readAt: null })]);
  return <div className="min-h-dvh lg:flex"><aside className="hidden bg-[#082d54] text-white lg:block lg:w-64 lg:shrink-0 p-4 sm:p-5 lg:min-h-dvh"><Link href="/" className="brand !text-white mb-8"><span className="brand-mark">◈</span>CAF BANK</Link><nav className="flex flex-col gap-1">{nav.map(x=><Link className="rounded-lg px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white whitespace-nowrap" key={x} href={x === "overview" ? "/dashboard" : `/dashboard/${x}`}>{t(x)}</Link>)}<SignOutButton/></nav></aside><div className="flex-1 min-w-0"><MobileNavigation links={nav.map(x => ({ label: t(x), href: x === "overview" ? "/dashboard" : `/dashboard/${x}` }))}/><header className="bg-white border-b border-blue-100 px-4 sm:px-6 lg:px-10 py-4 sm:py-5 flex flex-wrap gap-3 sm:gap-4 justify-between items-center"><div className="min-w-0"><p className="muted text-sm">{common("welcomeBack")}</p><h1 className="text-2xl font-bold break-words">{user.firstName}</h1></div><div className="flex flex-wrap items-center gap-3 sm:gap-4 min-w-0"><LanguageSelector compact/><Link href="/dashboard/transactions" aria-label={common("searchTransactions")}><Search size={21}/></Link><HeaderBadges initial={{messages:unreadMessages,notifications:unreadNotifications,support:unreadSupport}}/><Link href="/dashboard/profile" className="rounded-full bg-blue-100 text-blue-700 font-bold w-9 h-9 grid place-items-center">{user.firstName?.[0]}</Link></div></header><main className="min-w-0 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">{children}</main></div></div>;
}
