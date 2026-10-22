import { expect, test } from "@playwright/test";

test("detects browser language and keeps a manual selection", async ({ browser }) => {
  const context = await browser.newContext({ locale: "es-CO" });
  const page = await context.newPage();
  await page.goto("/auth");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { name: "Inicia sesión en CAF Bank" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  const saved = page.waitForResponse(response => response.url().endsWith("/api/settings/locale"));
  await page.getByRole("combobox", { name: "Idioma" }).selectOption("ar");
  const savedResponse = await saved;
  expect(savedResponse.request().postDataJSON()).toEqual({ locale: "ar" });
  expect(savedResponse.status()).toBe(200);
  expect(await context.cookies()).toContainEqual(expect.objectContaining({ name: "caf_locale", value: "ar" }));
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "تسجيل الدخول إلى CAF Bank" })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await context.close();
});

test("falls back to English for unsupported languages", async ({ browser }) => {
  const context = await browser.newContext({ extraHTTPHeaders: { "Accept-Language": "xx-XX" } });
  const page = await context.newPage();
  await page.goto("/auth");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Sign in to CAF Bank" })).toBeVisible();
  await context.close();
});
