"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/money";

type Account = { _id: string; name: string; currency: string; availableBalance: number };
type Beneficiary = { _id: string; name: string; bankName: string; accountIdentifier: string };

export default function TransfersPage() {
  const t = useTranslations("transfer");
  const common = useTranslations("common");
  const table = useTranslations("table");
  const accountLabels = useTranslations("accounts");
  const locale = useLocale();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [accountId, setAccountId] = useState("");
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState(1);
  const [transaction, setTransaction] = useState<{ _id: string; reference: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/accounts").then(response => response.json()).then((items: Account[]) => { setAccounts(items); setAccountId(items.find(account => account.name === "Cash Account")?._id || ""); });
    fetch("/api/beneficiaries").then(response => response.json()).then(setBeneficiaries);
  }, []);
  const recipient = beneficiaries.find(item => item._id === beneficiaryId);
  useEffect(() => {
    if (step !== 5 || !transaction) return;
    const timer = setInterval(async () => {
      const response = await fetch(`/api/transfers?id=${transaction._id}`);
      if (response.ok && (await response.json()).status === "PENDING") setStep(6);
    }, 5000);
    return () => clearInterval(timer);
  }, [step, transaction]);

  async function next() {
    setError("");
    if (step === 1) {
      const value = Number(amount);
      if (!accountId || !beneficiaryId || !description || !Number.isFinite(value)) { setError(t("incomplete")); return; }
      if (value < 300000) { setError(t("minimum")); return; }
      if (value > 9990000) { setError(t("maximum")); return; }
      setStep(2); return;
    }
    if (step === 2) { setStep(3); return; }
    if (step === 3) {
      setBusy(true);
      try {
        const response = await fetch("/api/transfers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId, beneficiaryId, amount, description }) });
        const data = await response.json();
        if (!response.ok) { setError(data.error); return; }
        setTransaction(data); setStep(4);
      } finally { setBusy(false); }
      return;
    }
    if (step === 4) {
      setBusy(true);
      try {
        const response = await fetch("/api/transfers/pin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactionId: transaction?._id, pin }) });
        const data = await response.json();
        if (!response.ok) { setError(data.error); return; }
        setPin(""); setStep(5);
      } finally { setBusy(false); }
    }
  }

  const steps = ["details", "recipient", "review", "pin", "admin", "confirmation"] as const;
  return <><span className="eyebrow">{t("eyebrow")}</span><h1 className="text-3xl font-bold mt-1">{t("title")}</h1><p className="muted mt-2">{t("hint")}</p><div className="flex flex-wrap gap-2 mt-7 mb-6">{steps.map((key, index) => <span key={key} className={`rounded-full px-3 py-2 text-sm font-semibold ${step === index + 1 ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"}`}>{index + 1}. {t(key)}</span>)}</div>
    <div className="card p-4 sm:p-7 max-w-2xl">{error && <p className="error mb-5">{error}</p>}
      {step === 1 && <div className="grid gap-5"><h2 className="text-xl font-bold">{t("details")}</h2><label className="field">{t("fromAccount")}<select value={accountId} onChange={event => setAccountId(event.target.value)}>{accounts.filter(account => account.name === "Cash Account").map(account => <option value={account._id} key={account._id}>{accountLabels("cash")} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {account.currency}</option>)}</select></label><label className="field">{t("recipient")}<select value={beneficiaryId} onChange={event => setBeneficiaryId(event.target.value)}><option value="">{t("chooseRecipient")}</option>{beneficiaries.map(item => <option value={item._id} key={item._id}>{item.name}</option>)}</select></label>{!beneficiaries.length && <Link href="/dashboard/beneficiaries" className="text-blue-700 font-semibold">{t("addBeneficiary")}</Link>}<label className="field">{table("amount")} (USD)<input type="number" min="300000" max="9990000" step="0.01" value={amount} onChange={event => setAmount(event.target.value)}/></label><label className="field">{t("reference")}<input value={description} onChange={event => setDescription(event.target.value)}/></label></div>}
      {step === 2 && <div><h2 className="text-xl font-bold">{t("recipient")}</h2><p className="muted mt-2">{t("confirmRecipient")}</p><dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:gap-4 mt-6 [&_dd]:min-w-0 [&_dd]:break-words"><dt>{common("name")}</dt><dd className="font-bold">{recipient?.name}</dd><dt>{common("bank")}</dt><dd className="font-bold">{recipient?.bankName}</dd><dt>{common("account")}</dt><dd className="font-bold">{recipient?.accountIdentifier}</dd></dl></div>}
      {step === 3 && <div><h2 className="text-xl font-bold">{t("reviewTitle")}</h2><p className="muted mt-2">{t("noDebit")}</p><dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 sm:gap-4 mt-6 [&_dd]:min-w-0 [&_dd]:break-words"><dt>{common("from")}</dt><dd className="font-bold">{accountLabels("cash")}</dd><dt>{t("recipient")}</dt><dd className="font-bold">{recipient?.name}</dd><dt>{table("amount")}</dt><dd className="font-bold">{formatMoney(Math.round(Number(amount) * 100), "USD", locale)}</dd><dt>{t("reference")}</dt><dd className="font-bold">{description}</dd></dl></div>}
      {step === 4 && <div><h2 className="text-xl font-bold">{t("pin")}</h2><p className="muted mt-2">{t("enterPin")}</p><label className="field mt-6">{t("pin")}<input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={event => setPin(event.target.value)}/></label><Link href="/dashboard/settings" className="text-blue-700 text-sm font-semibold mt-3 inline-block">{t("createPin")}</Link></div>}
      {step === 5 && <div><h2 className="text-xl font-bold">{t("awaiting")}</h2><p className="muted mt-2">{t("awaitingHint")}</p><p className="mt-5 break-all">{t("reference")}: <b>{transaction?.reference}</b></p><Link href="/dashboard/transactions" className="btn mt-6">{t("viewTransaction")}</Link></div>}
      {step === 6 && <div><h2 className="text-xl font-bold">{t("confirmed")}</h2><p>{t("confirmedHint")}</p></div>}
      {step < 5 && <div className="flex flex-wrap justify-between gap-3 mt-8">{step > 1 && step < 4 ? <button className="btn btn-outline" onClick={() => setStep(step - 1)}>{common("back")}</button> : <span/>}<button disabled={busy} className="btn" onClick={next}>{busy ? common("working") : step === 4 ? t("authorizePin") : step === 3 ? t("createTransaction") : common("continue")}</button></div>}
    </div>
  </>;
}
