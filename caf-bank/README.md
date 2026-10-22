# CAF Bank

An isolated banking course simulation built with Next.js App Router, React, TypeScript, Tailwind CSS, MongoDB/Mongoose, Auth.js, Zod, React Hook Form, bcryptjs, Nodemailer, Socket.IO, Lucide React, and date-fns. It does not connect to a real payment network.

## Run locally

1. Install Node.js 20+ and a MongoDB replica set. MongoDB transactions are required for activation credits and transfer debits. A single-node replica set is enough for local development.
2. Run `npm ci`.
3. Copy `.env.example` to `.env.local`. Set `MONGODB_URI`, a random `AUTH_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `EMAIL_FROM`, and `ADMIN_APPROVAL_EMAIL`. Configure SMTP authentication when needed. `APP_URL` and `AUTH_URL` should point to this app.
4. Run `npm run dev`, then open `http://localhost:3000`.
5. To create an admin, set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters in the command environment, then run `npm run admin:create`. Do not commit those values.

The application never shows verification or admin authorization codes in the browser or logs. Working SMTP is necessary to complete email verification and admin transaction authorization. Email jobs retain `QUEUED`, `SENT`, or `FAILED` state.

## Languages

The interface supports English, Spanish, French, German, Portuguese, Italian, Dutch, and Arabic with `next-intl`. First visits use `Accept-Language`; unsupported languages use English. The language selector saves a year-long `caf_locale` cookie and updates `User.preferredLocale` for signed-in users. Arabic sets `dir="rtl"`. Translation catalogs live in `messages/`; adding a locale also requires updating `src/i18n/locales.ts` and the `User.preferredLocale` enum. Account balances and recent transaction dates use the selected locale. User-written messages, recipient details, and email content are never automatically translated.

The installed next-intl plugin currently loads a native SWC addon that fails in this Windows environment. `next.config.ts` applies its documented `next-intl/config` Turbopack alias directly, while `src/i18n/request.ts`, `NextIntlClientProvider`, and the translation APIs follow the current App Router setup.

The private `.private/identity` directory holds uploaded documents and is excluded from Git and public routing. Use a private persistent volume in deployment. The built-in identity service checks name normalization but cannot authenticate a government document, so submissions enter the admin review queue. A real provider can replace `identityVerificationService.verify` to support a trustworthy automatic approval path.

Set `CRON_SECRET` to enable the custom server's hourly pending-follow-up job and five-minute email queue processor. An external scheduler can call the protected `POST /api/jobs/pending-followup` and `POST /api/jobs/email` endpoints with `Authorization: Bearer <CRON_SECRET>`. The follow-up job adds the 24-hour pending notice and does not complete the transaction.

Run `npm test`, `npm run lint`, and `npm run build` for checks. To run the MongoDB transaction integration tests in PowerShell, set `$env:RUN_MONGO_INTEGRATION='1'` and then run `npm test -- src/services/banking.integration.test.ts`. These tests start a temporary MongoDB replica set and may download a MongoDB binary on first use. For browser checks, run `npx playwright install chromium` once and then `npx playwright test`. The development and start commands use the custom Socket.IO server in `server.ts`.
