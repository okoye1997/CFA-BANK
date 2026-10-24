import { test, expect, type Browser, type Page } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import ts from "typescript";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Account, AuditLog, Beneficiary, Message, Notification, Receipt, Transaction, User } from "../src/lib/models";

const port = 3101;
const origin = `http://127.0.0.1:${port}`;
const widths = [320, 375, 390, 430, 768, 1024, 1366, 1440, 1920, 2560];
const customerPaths = ["/dashboard", "/dashboard/accounts", "/dashboard/accounts/transfer", "/dashboard/transfers", "/dashboard/transactions", "/dashboard/notifications", "/dashboard/profile", "/dashboard/settings", "/dashboard/support", "/dashboard/beneficiaries", "/dashboard/messages", "/dashboard/statements", "/dashboard/payments"];
const adminPaths = ["/admin", "/admin/transactions", "/admin/verifications", "/admin/audit", "/admin/support"];
const password = "responsive-test-password-2026";
let database: MongoMemoryReplSet;
let server: ChildProcess;
let customerState: Awaited<ReturnType<Awaited<ReturnType<Browser["newContext"]>>["storageState"]>>;
let adminState: typeof customerState;
let customerTransactionId: string;
let adminTransactionId: string;
let serverOutput = "";

async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw new Error(`Test server exited: ${serverOutput.slice(-2000)}`);
    try { if ((await fetch(`${origin}/auth`)).ok) return; } catch { /* Server is starting. */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Test server did not start: ${serverOutput.slice(-2000)}`);
}

async function signIn(browser: Browser, email: string) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${origin}/auth`);
  await page.getByLabel("Email Address", { exact: false }).fill(email);
  await page.getByLabel("Password", { exact: false }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/(dashboard|admin)$/, { timeout: 15_000 });
  const state = await context.storageState();
  await context.close();
  return state;
}

async function inspectPage(page: Page, path: string, width: number) {
  await page.goto(`${origin}${path}`, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(`${origin}${path}`);
  await expect(page.locator("h1").first()).toBeVisible();
  await page.waitForTimeout(120);
  const metrics = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const overflow = document.documentElement.scrollWidth - viewport;
    const main = document.querySelector("main")?.getBoundingClientRect();
    const sidebar = document.querySelector("aside")?.getBoundingClientRect();
    return { overflow, viewport, mainLeft: main?.left ?? 0, sidebarRight: sidebar?.right ?? 0 };
  });
  expect(metrics.overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(1);
  if (width >= 1024) expect(metrics.mainLeft, `${path} overlaps sidebar at ${width}px`).toBeGreaterThanOrEqual(metrics.sidebarRight - 1);
  if (width < 1024) {
    const menu = page.locator(".mobile-navigation summary");
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(page.locator(".mobile-navigation nav")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${path} open menu overflows at ${width}px`).toBeLessThanOrEqual(width + 1);
    await menu.click();
  }
}

test.beforeAll(async ({ browser }) => {
  database = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" }, instanceOpts: [{ launchTimeout: 60_000 }] });
  await mongoose.connect(database.getUri("caf_bank_responsive"));
  const hash = await bcrypt.hash(password, 10);
  const [customer, admin] = await User.create([
    { surname: "Customer", firstName: "Responsive", email: "responsive-customer@example.test", passwordHash: hash, role: "CUSTOMER", emailVerified: true, identityVerified: true, verificationStatus: "APPROVED" },
    { surname: "Admin", firstName: "Responsive", email: "responsive-admin@example.test", passwordHash: hash, role: "ADMIN", emailVerified: true, identityVerified: true, verificationStatus: "APPROVED" },
  ]);
  const [cash, gold] = await Account.create([
    { userId: customer._id, accountNumber: "8765432100004821", name: "Cash Account", currency: "USD", status: "ACTIVE", availableBalance: 125000000, ledgerBalance: 125000000 },
    { userId: customer._id, accountNumber: "8765432100007194", name: "Gold Account", currency: "GBP", status: "ACTIVE", availableBalance: 32500000, ledgerBalance: 32500000 },
  ]);
  const beneficiary = await Beneficiary.create({ userId: customer._id, name: "Long Recipient Name For Layout Verification", bankName: "Simulation", accountIdentifier: "SIM-998877665544332211", currency: "USD" });
  const completed = await Transaction.create({ userId: customer._id, accountId: cash._id, destinationAccountId: gold._id, recipientName: "Gold Account", amount: 250000, currency: "USD", reference: "TXN-20261024-ABCDEF0123456789", description: "Cash to Gold transfer with a long reference", type: "INTERNAL_TRANSFER", status: "COMPLETED", completedAt: new Date(), statusHistory: [{ status: "INITIATED", changedAt: new Date(), changedBy: customer._id, note: "Submitted" }, { status: "COMPLETED", changedAt: new Date(), changedBy: customer._id, note: "Posted" }] });
  const pending = await Transaction.create({ userId: customer._id, accountId: cash._id, beneficiaryId: beneficiary._id, recipientName: beneficiary.name, recipientBankName: beneficiary.bankName, amount: 500000, currency: "USD", reference: "TXN-20261024-0123456789ABCDEF", description: "Pending beneficiary transfer", type: "EXTERNAL_TRANSFER", status: "PENDING", statusHistory: [{ status: "PENDING", changedAt: new Date(), changedBy: admin._id, note: "Awaiting review" }] });
  customerTransactionId = String(completed._id);
  adminTransactionId = String(pending._id);
  await Receipt.create({ transactionId: completed._id, userId: customer._id, number: "RCT-20261024-ABCDEF0123456789", status: "COMPLETED", issuedAt: new Date() });
  await Notification.create({ userId: customer._id, type: "TRANSACTION_COMPLETED", title: "Transfer complete", href: `/dashboard/transactions/${completed._id}` });
  await Message.create({ userId: customer._id, type: "TRANSFER_SUCCESS", subject: "Transfer complete", body: "The transfer was posted." });
  await AuditLog.create({ actorId: admin._id, action: "TRANSACTION_REVIEW_STARTED", entityId: pending._id });

  // Reuse the project's server transpilation pattern, then run it against only the in-memory database.
  for (const file of ["src/server.ts", "src/lib/mongodb.ts", "src/lib/models.ts"]) {
    const source = readFileSync(file, "utf8");
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const target = join(".server", file.replace(/\.ts$/, ".js"));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, output);
  }
  const secret = "isolated-responsive-test-secret-not-for-deployment";
  server = spawn(process.execPath, [".server/src/server.js"], { env: { ...process.env, NODE_ENV: "production", PORT: String(port), MONGODB_URI: database.getUri("caf_bank_responsive"), APP_URL: origin, AUTH_URL: origin, NEXTAUTH_URL: origin, AUTH_SECRET: secret, NEXTAUTH_SECRET: secret, CRON_SECRET: "", SMTP_HOST: "" }, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout?.on("data", chunk => { serverOutput += String(chunk); });
  server.stderr?.on("data", chunk => { serverOutput += String(chunk); });
  await waitForServer();
  customerState = await signIn(browser, customer.email);
  adminState = await signIn(browser, admin.email);
});

test.afterAll(async () => {
  if (server && server.exitCode === null) server.kill();
  await mongoose.disconnect();
  if (database) await database.stop();
});

for (const width of widths) {
  test(`authenticated customer and admin layouts at ${width}px`, async ({ browser }) => {
    for (const [role, storageState, paths] of [["customer", customerState, customerPaths], ["admin", adminState, adminPaths]] as const) {
      const context = await browser.newContext({ viewport: { width, height: width < 768 ? 700 : 900 }, storageState });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      for (const path of paths) await inspectPage(page, path, width);
      await inspectPage(page, role === "customer" ? `/dashboard/transactions/${customerTransactionId}` : `/admin/transactions/${adminTransactionId}`, width);
      if (role === "customer") {
        await page.goto(`${origin}/api/transactions/${customerTransactionId}/receipt`);
        await expect(page.getByRole("heading", { name: "Transaction receipt" })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      }
      expect(errors, `${role} page errors at ${width}px`).toEqual([]);
      await context.close();
    }
  });
}
