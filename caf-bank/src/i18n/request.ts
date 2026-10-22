import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isAppLocale, negotiateLocale } from "./locales";
import { mergeMessages } from "./merge-messages";

export default getRequestConfig(async () => {
  const saved = (await cookies()).get("caf_locale")?.value;
  const locale = isAppLocale(saved) ? saved : negotiateLocale((await headers()).get("accept-language")) || defaultLocale;
  const english = (await import("./messages/en.json")).default;
  const translated = locale === "en" ? english : (await import(`./messages/${locale}.json`)).default;
  return { locale, messages: mergeMessages(english, translated) };
});
