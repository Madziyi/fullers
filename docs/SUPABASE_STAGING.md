# Supabase staging

## Configured October 27, 2026

User selected reuse of caption-assist (`cqnyvevhuxwfzhqpmccn`, Canada Central) after the two-active-Free-project limit blocked creating fullers-staging. No upgrade, pause or deletion occurred.

- Private `fullers` schema: 20 application/join tables plus Prisma history. All 21 tables have RLS; browser roles have no schema usage or SELECT access.
- Three repository migrations applied with search_path=fullers and registered through Prisma migrate resolve. Future DDL requires a management account.
- Dedicated fullers_runtime login: application CRUD with server-only RLS policies, no superuser, role/database creation, schema CREATE or RLS bypass. Real Prisma reads of Caption Assist tables were denied.
- Seven approved products, four bundled-photo media records and settings seeded. No invented content or default administrator.
- Private fullers-media bucket, 5 MiB maximum, image/webp derivatives and application/octet-stream original bytes; no browser policies.
- Existing Caption Assist tables/policies/settings preserved. Room/participant counts remained 53/110 after setup and disposable browser tests.

## Local configuration

Ignored `.env.supabase-staging` contains the generated database credential, unique auth/worker secrets, project URL and bucket. The original `.env` and user's preview were preserved. Credentials are not tracked.

The direct IPv6 PostgreSQL connection was verified with TLS chain and hostname checks using Supabase's public CA in ignored `.local-tools/supabase-root.crt`. The connection URL specifies verify-full and sslrootcert. For serverless hosting, copy the actual pooler URL from the dashboard, retain the dedicated role and schema=fullers, configure a small pool and supply the CA on that host. Do not infer a pooler hostname or disable certificate verification.

The Prisma adapter sets both its schema and PostgreSQL search_path, covering ORM and raw SQL. Existing local environments default to public.

**Server key configured:** the user saved a modern server key in SUPABASE_SECRET_KEY in ignored `.env.supabase-staging`. Actual private Storage operations were verified. Keep the key out of chat, Git and NEXT_PUBLIC_ variables. This shared project's server key has project-wide authority; retain it exclusively on the trusted server.

Staging selects the Supabase provider; missing/invalid credentials fail closed. Custom CMS authentication remains; Supabase Auth is not required. Initial administrator provisioning requires explicitly supplied credentials through the existing seed command.

## Media and hosting

Explicit local/Supabase storage providers are implemented. Vercel refuses local disk storage. Storage failure never falls back to disk. Existing publication/private-preview checks precede object reads; originals require administrator access. Objects are UUID.webp and UUID.original, never overwritten; failed record saves attempt exact-key cleanup. Bundled /assets/ photos stay in the application.

Before switching an existing environment containing uploads, copy both variants and verify bytes/reference counts. The new remote seed only references bundled photos.

Actual remote object uploads, authenticated reads, original-byte equality, duplicate-write rejection, public/unauthenticated denial and exact-object deletion passed. Desktop/mobile CMS workflows subsequently passed against both Supabase PostgreSQL and real private Storage. Final cleanup confirmed zero bucket objects, seven approved products, four bundled media records and zero users.

No deployed hostname exists, so no Cron job is active. Configure authenticated POST to /api/internal/publish-due only after hosting is ready, keeping its secret in Vault. Verify exact-version conflicts and idempotence.

The app accepts 5 MiB images; Vercel Functions limits request/response bodies to 4.5 MB. Controlled direct uploads or matching lower server/UI limits and original-download handling are needed before hosting there. Back up and restore-test Storage object bytes separately from PostgreSQL.

## Verification

- Lint, strict typecheck, 82 unit tests across 14 files and production build passed. Six tests cover private Storage adapter contracts.
- Production preview against Supabase passed home, catalogue, product detail, blog and login checks; guest upload returned 401.
- Existing desktop/mobile product/media workflows passed 2/2 against Supabase PostgreSQL and private Storage in 51.8 seconds. Disposable records and remote objects were removed. Earlier local-storage checks also passed.
- Real Prisma queries verified seven products, current_schema()=fullers and denied cross-app reads. All three Prisma baselines exist, all 21 tables use RLS, no Fullers table is browser-readable, and runtime schema CREATE is revoked.
- Initial sandbox build directory failure and interim TypeScript errors were corrected before the successful build. Initial browser testing against the original local database was stopped because that database was offline.
- Security advisors: intentional no-policy RLS on migration history, plus pre-existing Caption Assist anonymous-policy/password-protection warnings. Existing policies were preserved. [RLS advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [anonymous policy advisory](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins).
- Performance advisors: eight model foreign keys without covering indexes and unused fresh-schema indexes. Recorded informational follow-ups; retain workflow indexes pending workload evidence. [Index advisory](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).

Prisma history remains owned by fullers_runtime, which created it during baselining. Automatic approval review rejected a proposed transfer requiring temporary role membership. No workaround was executed. History remains private with RLS, and runtime schema CREATE was independently revoked. A future ownership transfer needs an approved owner-management path.

Explicit initial admin, scheduler, backups/restore and release UAT remain pending. No deployment, live DNS change, old-site modification or paid upgrade occurred.

References: [Prisma](https://supabase.com/docs/guides/database/prisma), [Storage security](https://supabase.com/docs/guides/storage/security/access-control), [server keys](https://supabase.com/docs/guides/getting-started/api-keys), [verified TLS](https://supabase.com/docs/guides/platform/ssl-enforcement).

## Storage verification follow-up

The user supplied the server key on October 27. Real testing found that Supabase returns HTTP 400 with a NoSuchKey/statusCode 404 body for missing object info, including after successful deletion. Switched the existence lookup from HEAD to GET and recognize only that exact missing-object code; permission/service errors remain failures. Added a regression test. Production build, lint/types, all 82 unit tests, the direct live Storage test and both desktop/mobile CMS workflows passed. Test cleanup now removes only its generated remote object keys when the Supabase provider is selected.
