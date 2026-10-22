import { expect, test } from "@playwright/test";

for (const width of [320, 375, 768, 1366, 1920]) {
  test(`public pages remain usable at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 800 }, deviceScaleFactor: width < 768 ? 2 : 1 });
    const page = await context.newPage();
    for (const path of ["/", "/auth", "/auth?mode=register", "/verify-email", "/identity-verification"]) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      const size = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth }));
      expect(size.page, `${path} overflows at ${width}px`).toBeLessThanOrEqual(size.viewport);
      await expect(page.getByRole("combobox", { name: "Language" })).toBeVisible();
    }
    await context.close();
  });
}

test("Arabic keeps narrow layout within the viewport", async ({ browser }) => {
  const context = await browser.newContext({ locale: "ar", viewport: { width: 320, height: 700 } });
  const page = await context.newPage();
  for (const path of ["/", "/auth"]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
  await context.close();
});
