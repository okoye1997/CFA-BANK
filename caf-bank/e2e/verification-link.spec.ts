import { expect, test } from "@playwright/test";

test("verification link displays the success confirmation", async ({ page }) => {
  let posted: unknown;
  await page.route("**/api/auth/verify-email", async route => {
    posted = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, verified: true }) });
  });
  await page.route("**/api/me", route => route.fulfill({ status: 401, contentType: "application/json", body: "{}" }));
  const token = "a".repeat(64);
  await page.goto(`/verify-email?email=member%40example.test&token=${token}`);
  await expect(page.getByRole("heading", { name: "Email Verified Successfully" })).toBeVisible();
  expect(posted).toEqual({ email: "member@example.test", token });
  await expect(page.getByRole("link", { name: "Continue to sign in" })).toHaveAttribute("href", "/auth");
});
