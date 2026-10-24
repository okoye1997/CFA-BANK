import { getLocale, getTranslations } from "next-intl/server";
import { currentUser } from "@/lib/auth";
import { Account } from "@/lib/models";
import { AccountCards } from "@/components/account-cards";
import Link from "next/link";

export default async function AccountsPage() {
  const user = await currentUser();
  const [accounts, locale, navigation, t, state] = await Promise.all([Account.find({ userId: user._id }).lean(), getLocale(), getTranslations("navigation"), getTranslations("accounts"), getTranslations("status")]);
  const labels = { title: t("title"), hide: t("hide"), show: t("show"), balances: t("balances"), available: t("available"), ledger: t("ledger"), cash: t("cash"), gold: t("gold") };
  return <><span className="eyebrow">{navigation("accounts")}</span><h1 className="text-3xl font-bold mt-1 mb-8">{t("title")}</h1><AccountCards locale={locale} labels={labels} statusLabels={{ ACTIVE: state("ACTIVE"), PENDING_VERIFICATION: state("PENDING_VERIFICATION"), SUSPENDED: state("SUSPENDED") }} accounts={accounts.map(account => ({ _id: String(account._id), accountNumber: account.accountNumber, name: account.name, currency: account.currency, availableBalance: account.availableBalance, ledgerBalance: account.ledgerBalance, status: account.status }))}/><Link className="btn mt-6 inline-block" href="/dashboard/accounts/transfer">Transfer between accounts</Link></>;
}
