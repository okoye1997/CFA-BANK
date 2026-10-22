export const locales = ["en", "es", "fr", "de", "pt", "it", "nl", "ar"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "en";
export const localeNames: Record<AppLocale, string> = { en: "English", es: "Español", fr: "Français", de: "Deutsch", pt: "Português", it: "Italiano", nl: "Nederlands", ar: "العربية" };

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && locales.includes(value as AppLocale);
}

export function negotiateLocale(header: string | null | undefined): AppLocale {
  const requested = (header || "").split(",").map((part) => {
    const [tag, weight] = part.trim().split(";q=");
    return { locale: tag.toLowerCase().split("-")[0], quality: weight === undefined ? 1 : Number(weight) };
  }).filter(({ quality }) => Number.isFinite(quality) && quality > 0).sort((a, b) => b.quality - a.quality);
  for (const { locale } of requested) if (isAppLocale(locale)) return locale;
  return defaultLocale;
}
