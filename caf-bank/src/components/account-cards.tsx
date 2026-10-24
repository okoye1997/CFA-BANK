"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { maskedAccount } from "@/lib/identifiers";
type Account = { _id: string; accountNumber?: string; name: string; currency: "USD" | "GBP"; availableBalance: number; ledgerBalance: number; status: string };
type Labels = Record<"title" | "hide" | "show" | "balances" | "available" | "ledger" | "cash" | "gold", string>;
const defaultLabels: Labels = { title: "Your accounts", hide: "Hide", show: "Show", balances: "balances", available: "Available balance", ledger: "Ledger balance", cash: "Cash Account", gold: "Gold Account" };

export function AccountCards({ accounts, locale = "en", labels = defaultLabels, statusLabels = {} }: { accounts: Account[]; locale?: string; labels?: Labels; statusLabels?: Record<string, string> }) {
  const [visible, setVisible] = useState(true);
  return <div><div className="flex flex-wrap justify-between items-center gap-3 mb-5"><h2 className="text-xl font-bold">{labels.title}</h2><button className="text-blue-700 flex gap-2 items-center font-semibold min-h-11" onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>} {visible ? labels.hide : labels.show} {labels.balances}</button></div><div className="grid md:grid-cols-2 gap-5">{accounts.map((account, index) => <div key={account._id} className={`min-w-0 rounded-2xl p-4 sm:p-7 text-white ${index === 0 ? "bg-gradient-to-br from-[#123e82] to-[#1475d0]" : "bg-gradient-to-br from-[#304f76] to-[#708eb0]"}`}><div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><p className="text-blue-100 text-sm">{account.name === "Cash Account" ? labels.cash : labels.gold}</p><p className="font-bold mt-1">{account.currency}</p>{account.accountNumber && <p className="text-blue-100 text-xs mt-1 break-all">Account {maskedAccount(account.accountNumber)}</p>}</div><span className="text-xs bg-white/20 rounded-full px-3 py-1 h-fit break-words">{statusLabels[account.status] || account.status.replaceAll("_", " ")}</span></div><p className="text-2xl sm:text-3xl font-bold mt-8 break-all">{visible ? formatMoney(account.availableBalance, account.currency, locale) : "••••••••"}</p><p className="text-blue-100 text-sm mt-2">{labels.available}</p><div className="border-t border-white/20 mt-6 pt-4 text-sm flex flex-wrap justify-between gap-2"><span>{labels.ledger}</span><span className="break-all">{visible ? formatMoney(account.ledgerBalance, account.currency, locale) : "••••••••"}</span></div></div>)}</div></div>;
}
