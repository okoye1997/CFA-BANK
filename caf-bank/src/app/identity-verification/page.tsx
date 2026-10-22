"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageSelector } from "@/components/language-selector";

export default function IdentityPage() {
  const router = useRouter(); const t = useTranslations("identity"); const common = useTranslations("common");
  const [documentType, setDocumentType] = useState("Passport");
  const [claimedName, setClaimedName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("PENDING");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch("/api/verification/identity").then(r => r.ok ? r.json() : null).then(data => { if (data?.status) setStatus(data.status); }); }, []);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) { setError(t("choose")); return; }
    setError(""); setBusy(true); setProgress(0);
    const form = new FormData();
    form.set("documentType", documentType);
    form.set("claimedName", claimedName);
    form.set("document", file);
    const request = new XMLHttpRequest();
    request.open("POST", "/api/verification/identity");
    request.upload.onprogress = event => { if (event.lengthComputable) setProgress(Math.round(event.loaded * 100 / event.total)); };
    request.onload = () => {
      setBusy(false);
      let data: { status?: string }; try { data = JSON.parse(request.responseText || "{}"); } catch { data = {}; }
      if (request.status < 200 || request.status >= 300) { setError(common("requestFailed")); return; }
      if (data.status) setStatus(data.status);
      if (data.status === "APPROVED") router.push("/dashboard");
    };
    request.onerror = () => { setBusy(false); setError(t("failed")); };
    request.send(form);
  }
  return <main className="min-h-screen p-6 flex justify-center items-center"><div className="card p-9 max-w-xl w-full"><div className="flex justify-end mb-4"><LanguageSelector compact/></div><span className="eyebrow">{t("eyebrow")}</span><h1 className="text-3xl font-bold mt-2">{t("title")}</h1><p className="muted mt-3">{t("hint")}</p>{error&&<p className="error mt-5">{error}</p>}<form onSubmit={submit} className="grid gap-5 mt-7"><label className="field">{t("type")}<select value={documentType} onChange={e=>setDocumentType(e.target.value)}><option value="Passport">{t("passport")}</option><option value="National ID">{t("nationalId")}</option><option value="Driver's Licence">{t("licence")}</option></select></label><label className="field">{t("name")}<input value={claimedName} onChange={e=>setClaimedName(e.target.value)} required/></label><label className="field">{t("upload")}<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e=>setFile(e.target.files?.[0]||null)} required/></label><div><p className="text-sm font-semibold">{t("progress")} Â· {progress}%</p><div className="h-2 bg-blue-100 rounded-full mt-2"><div className="h-2 bg-blue-600 rounded-full" style={{width:`${progress}%`}}/></div></div><div className="text-sm">{t("status")}: <span className="status">{status.replaceAll("_"," ")}</span></div><button disabled={busy} className="btn">{busy?t("submitting"):t("submit")}</button></form></div></main>;
}
