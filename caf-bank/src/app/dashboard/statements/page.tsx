import { getLocale, getTranslations } from "next-intl/server";
import { currentUser } from "@/lib/auth";
import { Transaction } from "@/lib/models";
import { formatMoney } from "@/lib/money";
export default async function StatementsPage() {
  const user = await currentUser();
  const [items, locale, t, nav, table, state] = await Promise.all([Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(100).lean(), getLocale(), getTranslations("recordsPage"), getTranslations("navigation"), getTranslations("table"), getTranslations("status")]);
  return <><span className="eyebrow">{t("eyebrow")}</span><h1 className="text-3xl font-bold mt-1">{nav("statements")}</h1><p className="muted mt-2">{t("hint")}</p><div className="card table-wrap mt-7"><table className="data-table"><thead><tr><th>{table("date")}</th><th>{table("reference")}</th><th>{table("description")}</th><th>{table("amount")}</th><th>{table("status")}</th></tr></thead><tbody>{items.length ? items.map(item => <tr key={String(item._id)}><td>{new Intl.DateTimeFormat(locale).format(new Date(item.createdAt))}</td><td>{item.reference}</td><td>{item.description}</td><td>{formatMoney(item.amount, "USD", locale)}</td><td>{state(item.status as "PENDING")}</td></tr>) : <tr><td colSpan={5} className="muted">{t("empty")}</td></tr>}</tbody></table></div></>;
}
