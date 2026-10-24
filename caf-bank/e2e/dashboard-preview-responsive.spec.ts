import { expect, test } from "@playwright/test";

for (const width of [320, 360, 375, 390, 412, 430, 480, 540, 640, 768, 820, 912, 1024, 1280, 1366, 1440, 1536, 1920, 2560, 3840]) {
  test(`dashboard preview fits ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 700 : 900 } });
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.goto("/preview/dashboard");
    await expect(page.getByText("Development preview")).toBeVisible();
    if (width < 1024) {
      const menu = page.getByText("Menu", { exact: true });
      await menu.click();
      await expect(page.locator("details nav")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await menu.click();
      await expect(page.locator("details nav")).toBeHidden();
    }
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(dimensions.content, `Dashboard page overflows at ${width}px`).toBeLessThanOrEqual(dimensions.viewport);
    expect(pageErrors).toEqual([]);
    await context.close();
  });
}
