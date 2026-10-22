# CAF Bank

CAF Bank is a **course banking simulation** built with Next.js 16 App Router, React 19, TypeScript, MongoDB/Mongoose, NextAuth, Nodemailer, Socket.IO, Tailwind CSS, and `next-intl`. It includes customer and admin experiences, but it does **not** connect to a real payment network or independently authenticate government documents.

## What the application does

- Customer registration and credential sign-in, with email verification by a single-use link or six-digit code.
- Identity-document submission, private file storage, and an admin review queue.
- Cash (USD) and Gold (GBP) accounts; account activation creates a one-time simulated USD credit after email and identity verification.
- Beneficiaries, a transaction PIN, an admin-authorized transfer workflow, transaction history, statements, messages, and notifications.
- Real-time support conversations and notification counts through Socket.IO.
- Reusable email templates and a queued email worker for non-secret messages.
- Eight interface languages: English, Spanish, French, German, Portuguese, Italian, Dutch, and Arabic (RTL).

The included transfer workflow reaches **`PENDING`** after admin authorization. It does not settle a transfer or change it to `COMPLETED`. Completed-transfer alerts run only when a trusted backend has already recorded `COMPLETED` in MongoDB.

## Requirements

- Node.js **20.9 or newer** and npm.
- A reachable **MongoDB replica set**. A single-node replica set is sufficient for local development; a standalone MongoDB server cannot support the transactions used for credits, debits, and notification creation.
- An SMTP service for registration verification and admin authorization emails.
- A persistent, private filesystem location for identity uploads in deployment.

Run all commands below from **`caf-bank/`**, the sole Node package and deployment root. Its `package.json` and `package-lock.json` belong together here.

## Local setup

1. Start a MongoDB replica set. For a local MongoDB installation, use a data directory you control:

   ```text
   mongod --replSet rs0 --dbpath <your-data-directory>
   mongosh --eval "rs.initiate()"
   ```

   Set `MONGODB_URI` to the resulting replica-set connection string, for example `mongodb://127.0.0.1:27017/caf_bank?replicaSet=rs0`. If your MongoDB service is already configured as a replica set, use its existing URI.

2. Install the locked dependencies:

   ```bash
   npm ci
   ```

3. Copy `.env.example` to `.env.local` and fill in the values described below. In PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Keep `.env.local` private. The committed example contains placeholders, not deployment credentials.

4. Start the application:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>. The dev command starts the project's custom Node server, which hosts Next.js and Socket.IO together. Do not start a second dev server on the same project at the same time.

5. Create an administrator when you need to review identities or authorize transfers. In PowerShell, set credentials only for the command session:

   ```powershell
   $env:ADMIN_EMAIL = "admin@example.test"
   $env:ADMIN_PASSWORD = "replace-with-a-unique-password-of-12-or-more-characters"
   npm run admin:create
   Remove-Item Env:ADMIN_PASSWORD
   ```

   Use a real, private admin address and password outside a demo. The command rejects an existing email and requires at least 12 password characters.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB replica-set URI. Required for database operations. |
| `AUTH_SECRET` | Strong random secret for NextAuth sessions and Socket.IO authentication. Required. |
| `NEXTAUTH_SECRET` | Optional NextAuth v4 secret. If set, use the **same value** as `AUTH_SECRET` so Socket.IO can validate the session token. |
| `AUTH_URL` | Fallback public origin for verification links if `APP_URL` is absent. It does not replace `NEXTAUTH_URL` for NextAuth v4. |
| `NEXTAUTH_URL` | Set to the same public origin when deploying NextAuth v4, especially behind a proxy. |
| `APP_URL` | Public origin used to construct verification links, notification links, and Socket.IO CORS origin. Use HTTPS in production. |
| `APP_NAME` | Name shown in generated email templates; defaults to `CAF Bank`. |
| `SMTP_HOST`, `SMTP_PORT`, `EMAIL_FROM` | SMTP host, port, and sender address. Required for verification and admin-code delivery. |
| `SMTP_SECURE` | Set to `true` when the SMTP connection uses implicit TLS; otherwise `false`. |
| `SMTP_USER`, `SMTP_PASSWORD` | SMTP authentication, if required by the provider. |
| `ADMIN_APPROVAL_EMAIL` | Address that receives the admin transfer-authorization code. |
| `CRON_SECRET` | Bearer secret protecting the scheduled job routes. Also enables the custom server's built-in timers. |
| `PORT` | Optional listening port; defaults to `3000`. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Supplied only when running `npm run admin:create`; do not put them in source control. |

Use the same origin for `APP_URL`, `AUTH_URL`, and `NEXTAUTH_URL` in a normal deployment. Never commit actual MongoDB, SMTP, session, admin, or cron credentials. `.env.local` is ignored by Git.

## Banking and verification flow

1. **Register:** the server creates a customer and two zero-balance accounts. SMTP sends a ten-minute verification link and the existing six-digit code. Only hashes of these credentials are stored; email-job records do not retain the link token or code.
2. **Verify email:** either credential verifies the address once. A successful verification records an audit entry and persistent in-app and email confirmations. An expired or used credential cannot verify the account again.
3. **Verify identity:** the customer uploads a PDF, JPEG, or PNG (up to 8 MB). Files are stored outside `public/` in `.private/identity/`. The built-in checker can compare names and file signatures, but cannot establish document authenticity; submissions enter the admin review queue. Admin approval activates the accounts and posts the one-time simulated USD 10,000,000 Cash Account credit.
4. **Request a transfer:** an eligible customer selects a beneficiary and submits a Cash Account transfer between USD 300,000 and USD 9,990,000. The customer confirms it with a six-digit transaction PIN. An admin receives a separate single-use code by email.
5. **Admin authorization:** the backend validates the code and available funds, writes the debit and ledger entry in a MongoDB transaction, then sets the transfer to `PENDING`. A pending confirmation is sent. This is **not** a completion notice.
6. **Completion alert:** when a trusted settlement process records `COMPLETED` (and ideally `completedAt`), the protected email job finds the record and creates one persistent in-app notice and one email job using stored transaction and recipient data. The worker never marks a pending transfer complete.

The app does not connect to a payment rail. Identity approval and transfer completion must not be mistaken for external bank verification or settlement.

## Jobs and email delivery

With `CRON_SECRET` configured, the long-running custom server calls these routes using `Authorization: Bearer <CRON_SECRET>`:

| Route | Built-in interval | Work |
| --- | --- | --- |
| `POST /api/jobs/email` | Every 5 minutes | Queue alerts for already-completed transfers and process queued email jobs. |
| `POST /api/jobs/pending-followup` | Every hour | Add a notice for transfers still pending after 24 hours. It does not complete them. |

An external scheduler can call the same routes if preferred. Secret-code emails are sent directly so a verification or admin code is not stored in a retryable email job. Ordinary notices use email jobs with `QUEUED`, `SENT`, or `FAILED` status. A failed SMTP delivery is recorded; investigate failed jobs and the SMTP configuration rather than assuming delivery succeeded.

## Internationalization

`next-intl` reads a saved `caf_locale` cookie first, then the browser's `Accept-Language` header. Unsupported languages fall back to English. The language selector is available on sign-in and within the application; a manual choice persists in the cookie and, for signed-in users, in `User.preferredLocale`. Arabic sets `dir="rtl"`. Interface dates, numbers, and balances use the selected locale. User-written messages and outbound email content are not automatically translated.

Catalogs are in `src/i18n/messages/{en,es,fr,de,pt,it,nl,ar}.json`. To add a language, add its catalog and update `src/i18n/locales.ts` and the `User.preferredLocale` enum in `src/lib/models.ts`. `src/i18n/request.ts` merges missing keys from English. The current `next.config.ts` supplies the `next-intl/config` Turbopack alias directly because the installed plugin's native SWC dependency does not load in this Windows setup.

## Project layout

```text
caf-bank/
├── e2e/                    # Playwright browser checks
├── public/                 # Static images and branding (Next.js root convention)
├── scripts/                # Custom server launcher and admin creation command
├── src/
│   ├── app/                # App Router pages, layouts, and API routes
│   ├── components/         # Shared UI components
│   ├── i18n/               # Locale detection, request config, and JSON catalogs
│   ├── lib/                # Auth, MongoDB models, validation, money, and email helpers
│   ├── services/           # Registration, verification, accounts, transfers, jobs, support
│   ├── types/              # TypeScript declarations
│   └── server.ts           # Next.js + Socket.IO custom server
├── .env.example
├── next.config.ts
├── package.json
├── package-lock.json
├── playwright.config.ts
├── tsconfig.json
└── vitest.config.mts
```

Generated `.next/`, `.server/`, `.swc-cache/`, test output, `tsconfig.tsbuildinfo`, `node_modules/`, and private uploads stay outside `src/` and are ignored by Git. Keep `public/` and project configuration at the root.

## Checks

| Command | Purpose |
| --- | --- |
| `npm run lint` | ESLint. |
| `npx tsc --noEmit` | TypeScript check. |
| `npm test` | Vitest unit tests; MongoDB integration tests are opt-in. |
| `npm run build` | Production Next.js build. |
| `npm start` | Run the production build with the custom Socket.IO server. |
| `npx playwright test` | Browser checks; Playwright starts `npm run dev` unless a server already exists on port 3000. |

For the replica-set integration suite, set `RUN_MONGO_INTEGRATION=1` and run `npm test -- src/services/banking.integration.test.ts`. It starts a temporary MongoDB replica set and may download a MongoDB binary on first use. On PowerShell:

```powershell
$env:RUN_MONGO_INTEGRATION = "1"
npm test -- src/services/banking.integration.test.ts
Remove-Item Env:RUN_MONGO_INTEGRATION
```

Install the browser once with `npx playwright install chromium` before Playwright checks. The verification-link browser test mocks its API response; the integration suite exercises verification and transfer records against MongoDB with mocked SMTP. Neither test proves delivery through an external SMTP provider or a real settlement network.

## Deployment notes

1. Deploy as a **long-running Node.js process**. Run `npm ci`, `npm run build`, then `npm start`. The app uses `src/server.ts` for Socket.IO and the built-in timers; a plain `next start` or serverless deployment will not provide that server behavior. Next.js standalone output does not bundle this custom server.
2. Provide a MongoDB replica set, private SMTP configuration, strong `AUTH_SECRET` and `CRON_SECRET`, and HTTPS public URLs. Set `NEXTAUTH_URL`, `AUTH_URL`, and `APP_URL` to the deployed origin.
3. Mount a persistent private volume for `.private/identity/`; it must not be web-served or committed. Ensure only the application process can read uploaded documents.
4. Keep the process running or configure an external scheduler for the protected job routes. If an external scheduler is used, still run the custom server for Socket.IO.
5. Back up MongoDB and the private upload volume according to the requirements of the deployment environment. The repository does not contain a production identity-verification provider or payment settlement integration.
