# M3B verification record

M3B implements reliable scheduled article publication on `feat/m3b-publishing-reliability`, stacked on M3A. No production service, cron provider or old-site change was made. The user-run preview on port 3107 remained available throughout QA.

## Delivered behavior

- Administrators choose a local publication time labelled `Africa/Harare`; the database stores the instant in UTC. Editors may prepare content but cannot schedule or publish it.
- A schedule job records the exact saved `Post.version`. Saving another version invalidates the pending job, clears the scheduled time and shows **Needs review**. A scheduled draft stays private; an existing public snapshot remains unchanged.
- The internal POST worker checks a high-entropy `PUBLISH_WORKER_SECRET` using constant-time comparison, claims due jobs with PostgreSQL `FOR UPDATE SKIP LOCKED`, validates the exact version and promotes the immutable snapshot and job state in one transaction.
- Temporary errors receive bounded retries with increasing backoff. Stale versions, invalid content and slug conflicts remain private and become visible review states. Retried delivery is idempotent.
- No revision browser, restore or rollback UI was built; immutable publication snapshots remain the delivery boundary.

## Verification

- `npm run typecheck` and `npm run lint` passed.
- `npm test`: 51 tests passed across 9 files.
- `npm run test:db`: database seed, public visibility and constraint checks passed; 3 worker/concurrency integration tests passed.
- `npm run build` passed with isolated output directory `.next-m3b-final` and the internal worker route included.
- `npm run test:e2e`: 20 desktop/mobile tests passed, including Harare schedule entry, public 404 before publication, schedule invalidation after an edit, article publication, M2 flows and accessibility checks.
- The e2e schedule check captured [desktop](screenshots/m3b-schedule-desktop.png) and [mobile](screenshots/m3b-schedule-mobile.png) screenshots.

For a separate local run, preserve the main preview and use the isolated output/port:

```powershell
$env:NEXT_BUILD_DIR = '.next-m3b-final'
$env:NEXT_PUBLIC_SITE_URL = 'http://127.0.0.1:3117'
$env:NEXTAUTH_URL = 'http://127.0.0.1:3117'
npm run build
$env:PLAYWRIGHT_PORT = '3117'
npm run test:e2e
npm run test:db
```

The database suites require the migrated disposable QA database. They must never target production data.

## Release configuration still required

No hosting scheduler is configured. Until a dependable provider is selected and configured, a saved schedule remains queued and private. Before release, provision `PUBLISH_WORKER_SECRET` as a random secret of at least 32 bytes and configure the hosting scheduler to POST to `/api/internal/publish-due` with `Authorization: Bearer <secret>` at a frequent interval (for example, every minute). Keep the secret in the provider's secret store, never in source control or a URL. Confirm the provider supports authenticated POST requests and define alerting for worker errors and jobs in `FAILED`/`NEEDS_REVIEW`.

Later M3 work remains product editing/media library, richer article blocks, page sections, project approvals, enquiry management, redirects, account/role management and audit browsing. M4 remains staging and release hardening. No deployment was performed.
