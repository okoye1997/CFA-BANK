import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight, Bell, CircleHelp, Mail, MessageSquare, ReceiptText, Search } from "lucide-react";
import { AccountCards } from "@/components/account-cards";
import { ActivityChart } from "@/components/activity-chart";
import { formatMoney } from "@/lib/money";
import { MobileNavigation } from "@/components/mobile-navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPreview() {
  if (process.env.NODE_ENV !== "development") notFound();

  const [locale, nav, common, dashboard, accountsText, table, state] = await Promise.all([
    getLocale(), getTranslations("navigation"), getTranslations("common"), getTranslations("dashboard"),
    getTranslations("accounts"), getTranslations("table"), getTranslations("status"),
  ]);
  const accounts = [
    { _id: "preview-cash", name: "Cash Account", accountNumber: "0000000000004821", currency: "USD" as const, availableBalance: 125000000, ledgerBalance: 125000000, status: "ACTIVE" },
    { _id: "preview-gold", name: "Gold Account", accountNumber: "0000000000007194", currency: "GBP" as const, availableBalance: 32500000, ledgerBalance: 32500000, status: "ACTIVE" },
  ];
  const transactions = [
    { reference: "TXN-PREVIEW-001", description: "Cash to Gold transfer", amount: 250000, status: "COMPLETED", createdAt: new Date().toISOString() },
    { reference: "TXN-PREVIEW-002", description: "Transfer to beneficiary", amount: 800000, status: "PENDING", createdAt: new Date().toISOString() },
  ];
  const sections = ["overview", "accounts", "payments", "transfers", "transactions", "statements", "beneficiaries", "messages", "support", "profile", "settings"] as const;

  return <div className="min-h-dvh lg:flex">
    <aside className="hidden bg-[#082d54] text-white lg:block lg:w-64 lg:shrink-0 p-4 sm:p-5 lg:min-h-dvh">
      <Link href="/" className="brand !text-white mb-8"><span className="brand-mark">◈</span>CAF BANK</Link>
      <nav className="flex flex-col gap-1">{sections.map(section => <span key={section} className={`rounded-lg px-4 py-3 text-sm font-semibold whitespace-nowrap ${section === "overview" ? "bg-white/10 text-white" : "text-blue-100"}`}>{nav(section)}</span>)}</nav>
    </aside>
    <div className="flex-1 min-w-0">
      <MobileNavigation showSignOut={false} links={sections.map(section => ({ label: nav(section), href: "/preview/dashboard" }))}/>
      <header className="bg-white border-b border-blue-100 px-4 sm:px-6 lg:px-10 py-4 sm:py-5 flex flex-wrap gap-3 sm:gap-4 justify-between items-center">
        <div><p className="muted text-sm">{common("welcomeBack")}</p><h1 className="text-2xl font-bold">Preview</h1></div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 min-w-0"><Search size={21}/><Mail size={21}/><Bell size={21}/><CircleHelp size={21}/><span className="rounded-full bg-blue-100 text-blue-700 font-bold w-9 h-9 grid place-items-center">P</span></div>
      </header>
      <main className="min-w-0 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
        <div className="mb-5"><span className="eyebrow">{nav("overview")}</span><h1 className="text-3xl font-bold mt-1">{dashboard("title")}</h1><p className="muted mt-2">{dashboard("hint")}</p></div>
        <p className="text-sm text-blue-700 mb-6">Development preview · Sample balances and transactions</p>
        <AccountCards accounts={accounts} locale={locale} statusLabels={{ ACTIVE: state("ACTIVE") }} labels={{ title: accountsText("title"), hide: accountsText("hide"), show: accountsText("show"), balances: accountsText("balances"), available: accountsText("available"), ledger: accountsText("ledger"), cash: accountsText("cash"), gold: accountsText("gold") }}/>
        <div className="grid sm:grid-cols-3 gap-4 my-8">{[[dashboard("makeTransfer"), ArrowUpRight], [dashboard("viewTransactions"), ReceiptText], [`${nav("messages")} (0)`, MessageSquare]].map(([title, Icon]) => <div key={title as string} className="card p-5 flex items-center justify-between font-bold"><span>{title as string}</span><Icon className="text-blue-600" size={21}/></div>)}</div>
        <section className="card p-6"><div className="flex justify-between"><h2 className="text-xl font-bold">{dashboard("recent")}</h2><span className="text-blue-700 font-semibold">{dashboard("viewAll")}</span></div><div className="table-wrap mt-4"><table className="data-table"><thead><tr><th>{table("date")}</th><th>{table("reference")}</th><th>{table("description")}</th><th>{table("amount")}</th><th>{table("status")}</th></tr></thead><tbody>{transactions.map(transaction => <tr key={transaction.reference}><td>{new Intl.DateTimeFormat(locale).format(new Date(transaction.createdAt))}</td><td>{transaction.reference}</td><td>{transaction.description}</td><td>{formatMoney(transaction.amount, "USD", locale)}</td><td><span className="status">{state(transaction.status as "PENDING")}</span></td></tr>)}</tbody></table></div></section>
        <ActivityChart transactions={transactions}/>
      </main>
    </div>
  </div>;
}
