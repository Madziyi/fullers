# Staging release preparation

The Supabase database and private media storage are verified. This document prepares a separate staging deployment; it does not authorize changes to the old site or live DNS.

## Account and origin inputs

User initially chose Hostinger, then requested manual instructions for both Hostinger and Vercel. Neither account is connected for deployment. A provider account/session and final HTTPS staging hostname are needed before deployment. No plan upgrade is authorized. Do not deploy this business app under a plan whose terms exclude commercial use.

The user supplied ADMIN_EMAIL and ADMIN_PASSWORD in ignored .env.supabase-staging. The initial administrator was provisioned and production sign-in/administrator navigation verified. For any additional initial setup, supply explicit credentials in that ignored file. Password must be at least 16 characters and at most 72 UTF-8 bytes. Run the existing seed using this file; it preserves existing catalogue, settings and accounts. Remove password provisioning inputs from runtime environments afterwards. Never copy the local QA account or invent a default password.

## Environment

Use the already-verified Supabase credentials from the ignored staging file. Configure server-side secrets through the provider's secret/environment controls, never a tracked deployment manifest. The current PostgreSQL URL contains a local CA path: supply the same public CA on the host and update sslrootcert, or use an equivalent verified-TLS setup. For Vercel, obtain the actual pooled connection from Supabase, keeping the restricted role and schema=fullers. Do not use an administrative database login for runtime traffic.

Set CONTENT_SOURCE=database, MEDIA_STORAGE_PROVIDER=supabase, SITE_INDEXING_ENABLED=false, and set NEXTAUTH_URL and NEXT_PUBLIC_SITE_URL to the exact HTTPS staging origin. Retain separate strong NEXTAUTH_SECRET and PUBLISH_WORKER_SECRET values. Rebuild after changing origin/indexing values. The provider must not expose server secrets under NEXT_PUBLIC_ names.

## Implemented host safeguards

The original 5 MiB upload allowance is retained for Hostinger. A temporary 4 MiB reduction was tested and then withdrawn when the user selected Hostinger. Before Vercel deployment, consistently reduce new uploads/optimized output to fit its 4.5 MB function-body ceiling or implement controlled direct uploads, and support any larger original downloads through an authorized delivery path. No Vercel payload fix is claimed in the final source.

SITE_INDEXING_ENABLED=false adds a noindex/nofollow HTTP header, robots disallow-all, and an empty sitemap. This is indexing control, not authentication: use the host's deployment access protection for private review. Configure an authenticated scheduler bypass if that protection would otherwise block the worker.

## Publication scheduler

Do not activate a job before the hostname, worker secret and deployment access are verified. Prefer Supabase Cron calling POST /api/internal/publish-due each minute. Store the target origin and bearer secret in Vault; never commit secrets in SQL. Give the job a distinct Fullers name and inspect existing Caption Assist jobs/extensions before adding anything. Do not modify unrelated schedules or project-wide auth settings.

Verify an authenticated empty worker run, rejected unauthenticated requests, exact-version conflict handling, retries and idempotence. Inspect both Cron HTTP completion and application publication-job states: an accepted async HTTP request alone does not prove successful publication.

## Deployment checks

Confirm HTTPS/secure cookies and exact-origin login, initial admin authorization, private enquiries and originals, uploaded image rendering, public draft exclusion, robots/noindex/sitemap, and original-byte download. Use separate desktop/mobile checks and remove only disposable fixtures. Test database and object-storage backup/restore, rate controls, administrator recovery/MFA and business privacy approvals before public admin exposure or live release.

A working staging deployment does not switch the live domain. Review the complete staging result before any public launch or old-site change.

## Manual handoff status

Initial administrator provisioned from explicit user credentials and production login verified. Staging noindex header, robots disallow-all, empty sitemap, rejected guest worker invocation and successful authenticated worker invocation were verified. Lint/types, 82 unit tests and production build passed during preparation; desktop/mobile CMS checks passed with the temporary 4 MiB boundary before its withdrawal. Original 5 MiB remote Storage workflows were verified in the preceding slice. No scheduler was activated and no host deployed. User requested manual steps rather than further account access.

Current hosting source is on local branch codex/supabase-staging. Push that branch before importing it from GitHub; no push of this branch has occurred. The local TLS CA is not in Git; upload it separately on the chosen host and update sslrootcert, or obtain the Supabase pooler URL with a properly trusted certificate. Never upload the ignored environment file as public website content.
