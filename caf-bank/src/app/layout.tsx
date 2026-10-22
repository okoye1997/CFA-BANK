import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";
export const metadata: Metadata = { title: "CAF Bank", description: "Secure banking simulation" };
export default async function RootLayout({ children }: { children: React.ReactNode }) { const locale = await getLocale(); return <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-scroll-behavior="smooth"><body><NextIntlClientProvider>{children}</NextIntlClientProvider></body></html>; }
