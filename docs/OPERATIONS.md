# Local operations and release gates

## Run locally

Use Node.js 22.15+ and PostgreSQL 17. `npm ci`, copy `.env.example` to `.env`, supply DATABASE_URL, generate NEXTAUTH_SECRET with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, and set both URL variables to the actual local origin.

Set CONTENT_SOURCE=database. Provide ADMIN_EMAIL and a unique ADMIN_PASSWORD (16+ characters, maximum 72 UTF-8 bytes). Run `npm run db:generate`, `npm run db:migrate`, then `npm run db:seed`. The seed is idempotent: it preserves existing records, including passwords and administrator edits. It never creates published articles/projects or overwrites existing settings. Remove provisioning inputs from deployed runtime environments after creating the account.

Run `npm run dev`, or `npm run build` then `npm start`. Public homepage is `/`, catalogue `/products`, custom administrator sign-in `/admin/login`. No default administrator password exists. The generated ignored `.env` in this workspace contains the isolated QA account; do not commit it. The local QA PostgreSQL runtime is in ignored `.local-tools/`; its server listens only on 127.0.0.1:55432. It is not a system service or production database. For this session it is controlled by the retained Node process, and can be stopped using Ctrl+C in that process. It does not contain customer data.

For public-only review without PostgreSQL, explicitly set CONTENT_SOURCE=seed. This mode is immutable. Admin authentication still requires a database; settings saves are rejected rather than pretending the preview was updated. A database outage in database mode is an error, never a silent switch to the seed.

## Validation

`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:db`, `npm run build`, `npx playwright install chromium`, `npm run test:e2e`. The database and E2E suites require a fresh migrated and seeded database with the seven original products and a seeded administrator. They must run only against a disposable local/CI database. The admin E2E changes `jobsValue` to `701+`, checks the homepage, then restores `700+`. The browser suite uses dedicated port 3107 and refuses to reuse existing servers. Set both local URL variables to http://127.0.0.1:3107 before building for E2E tests. Use one worker to keep shared settings checks deterministic. Database constraint fixtures fail or roll back; no fake public projects are created. CI runs the full flow with a disposable PostgreSQL service.

The approved assets live in assets/ and are copied unchanged to public/assets/. assets/dimensions.json records measured source dimensions. Next Image serves optimized responsive variants. Logo remains the low-resolution original, not a redesigned mark. No remote fonts or stock imagery.

## Before any staged/internet release

- Select hosting, managed PostgreSQL, object storage and HTTPS origin. Set the canonical URL before build; localhost is for this local review only. Do not enable public indexing on staging.
- Provision separate environments and users with minimum DB privileges. Use secure cookie behavior over HTTPS. No production deployment is part of M1.
- Add edge/IP login throttling alongside M1's database account throttle; prune old throttle rows. Complete administrator MFA and recovery workflow before public admin exposure. Eight-hour JWT sessions recheck active/role from DB at every protected request.
- M2 adds validated private enquiry intake, consent, a factual noindex form notice, honeypot/signed tokens, database quotas and an administrator inbox. Approve the full privacy/retention policy before release. Phone and WhatsApp remain available when the form is unavailable; no email notifications are configured. See M2_QA.md for quotas and test isolation.
- Complete M3 allowlisted rich-text renderer, media validation, server authorization on every new mutation, revisions, safe previews and dependable scheduling worker. Never render arbitrary HTML from JSON. Review CSP nonces instead of the current Next-compatible inline script allowance.
- Add monitored readiness/health, error reporting and scheduled backups. For PostgreSQL use managed snapshots plus `pg_dump --format=custom`; restore into a separate disposable database using `pg_restore`, run migrations and verify counts, media references, settings and login before recording a restore test. No backup/restore exercise was performed in M1.
- Confirm photo reuse rights/attribution, product specifications, actual delivery regions, award detail, privacy notice and enquiry recipient.
- Verify real field CWV (LCP/CLS/INP), keyboard/screen-reader flows and staging UAT; automated axe is not a complete accessibility audit. No performance score or SEO ranking is promised.
- Review old URL mapping before enabling redirects. The original `/elementor-257/` page was inaccessible during M1; no unverified live redirects were enabled. A Redirect schema exists for M3 management and M4 mapping review.

The original source WhatsApp link could not be inspected because the legacy page was inaccessible and the MHT file was not bundled here. The active link is derived solely from the approved +263 78 747 8592 number: `https://wa.me/263787478592`. Confirm it with Fullers before release. The map opens a search for Bindura/Sandazi Farm and does not assert a verified geocoordinate.
