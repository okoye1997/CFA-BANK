"use client";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
export function SignOutButton(){const t=useTranslations("common");return <button className="rounded-lg px-4 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-blue-50 whitespace-nowrap" onClick={()=>signOut({callbackUrl:"/"})}>{t("signOut")}</button>}
