import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "authenticated-responsive.spec.ts",
  workers: 1,
  timeout: 180_000,
  use: { ...devices["Desktop Chrome"] },
});
