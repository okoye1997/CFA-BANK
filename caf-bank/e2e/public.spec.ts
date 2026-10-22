import { expect, test } from "@playwright/test";
test("landing navigation and authentication forms", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /banking built around your financial life/i })).toBeVisible();
  await page.getByRole("link", { name: "Create Account" }).first().click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  for (const label of ["Surname *", "First Name *", "Last Name (optional)", "Email Address *", "Password *", "Country *", "Home Address *", "Phone Number *"]) await expect(page.getByLabel(label, { exact: true })).toBeVisible();
  await page.goto("/auth", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Sign in to CAF Bank" })).toBeVisible();
});
