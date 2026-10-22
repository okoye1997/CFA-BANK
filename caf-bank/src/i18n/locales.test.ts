import { describe, expect, it } from "vitest";
import { isAppLocale, negotiateLocale } from "./locales";
import { formatMoney } from "@/lib/money";
import { mergeMessages } from "./merge-messages";

describe("locale negotiation", () => {
  it.each([["es-CO,es;q=0.8", "es"], ["fr-FR,fr;q=0.9", "fr"], ["pt-BR", "pt"], ["ar-EG", "ar"], ["xx-XX", "en"], ["", "en"]])("maps %s to %s", (header, expected) => {
    expect(negotiateLocale(header)).toBe(expected);
  });
  it("uses language quality and rejects unsupported preferences", () => {
    expect(negotiateLocale("de;q=0.5,nl;q=0.9")).toBe("nl");
    expect(isAppLocale("xx")).toBe(false);
  });
  it("formats currency and dates with locale conventions", () => {
    expect(formatMoney(123456, "USD", "de")).toContain("1.234,56");
    expect(new Intl.DateTimeFormat("de", { day: "numeric", month: "numeric", year: "numeric" }).format(new Date("2026-10-22T12:00:00Z"))).toContain("22.10.2026");
  });
  it("falls back to English for missing translations", () => {
    expect(mergeMessages({ menu: { title: "Settings", save: "Save" } }, { menu: { title: "Ajustes" } })).toEqual({ menu: { title: "Ajustes", save: "Save" } });
  });
});
