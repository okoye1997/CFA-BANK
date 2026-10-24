"use client";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
export function SignOutButton(){const t=useTranslations("common");return <button className="min-h-11 rounded-lg px-4 py-3 text-left text-sm font-semibold text-blue-100 hover:bg-white/10 hover:text-white whitespace-nowrap" onClick={()=>signOut({callbackUrl:"/"})}>{t("signOut")}</button>}
