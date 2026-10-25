# M3B — dependable scheduled publication

Status: implementation and local QA complete on `feat/m3b-publishing-reliability`, stacked on M3A. Review PR/hosted CI are pending. User confirmed no revision restore UI is needed and explicitly asked to handle conflicting edits safely.

## Outcome

An administrator can schedule a validated article for a Zimbabwe-local date and time. The CMS stores an unambiguous UTC instant, keeps the draft private before the due time, and promotes the exact saved version atomically when a protected worker runs. Duplicate worker calls cannot publish twice. Transient failures are retried with backoff; permanent validation failures and stale draft versions become visible states that require administrator review. Editing a scheduled draft invalidates that schedule instead of silently publishing content the administrator did not schedule.

The same `Post.version` compare-and-swap used by autosave remains the boundary for concurrent editors. A stale edit fails visibly and reloads the current draft; a schedule binds to the saved version so later edits never leak into a live publication.

## Included

- Africa/Harare schedule picker and explicit timezone label, UTC storage, validation of nonexistent/ambiguous local values.
- Administrator-only schedule, reschedule and cancellation actions, checked against the latest saved version.
- Durable schedule-job rows with immutable post/version/run time, state, bounded attempts, retry time and sanitized error.
- Authenticated worker route, constant-time secret check, bounded batches and PostgreSQL row claiming that allows concurrent invocations safely.
- Atomic publication snapshot, post pointer and job completion; idempotent retry, exponential retry for transient errors, conflict/failure state for actionable errors.
- Clear status on article list/editor; drafts and current live snapshot remain private/stable when schedule versions conflict.
- Focused tests for time conversion, version conflicts, permission boundaries, repeated/concurrent delivery, retry behavior and public visibility.

## Explicitly excluded

- No revision browser, revision restore or rollback UI. Immutable snapshots remain the publication mechanism and are not being removed.
- No deployment, old website changes, or assumption of a hosting provider. A production cron still has to be configured to call the protected worker endpoint; local tests invoke the same worker directly.
- No scheduling for pages/products/projects in this slice.

## Worker contract

1. Accept only POST, require a configured high-entropy worker secret, compare it in constant time, and reject malformed/bounded request parameters.
2. Claim only due pending jobs inside a database transaction using `FOR UPDATE SKIP LOCKED`; independent calls cannot claim the same row.
3. Read the post and current draft under the claim. If missing, deleted, already superseded, or `Post.version` differs from the scheduled version, record a safe terminal status and never publish.
4. Reuse the M3A server-side publication validation. Create one immutable revision for the scheduled version, update the public pointer and finish the job atomically. All public queries continue to use the published snapshot only.
5. Retry eligible transient failures with capped exponential backoff and a maximum attempt count. Store a short sanitized error, never credentials or request headers.

## Acceptance

- A Harare wall-clock value round-trips through UTC and back without timezone-dependent host behavior; invalid and past dates are rejected.
- Anonymous requests cannot run the worker; missing/incorrect secret does not reveal job data.
- Concurrent/repeated runs do not duplicate revisions or apply a job twice.
- A scheduled draft stays out of HTML, metadata and sitemap before publication.
- Editing after scheduling marks the job as requiring review; the worker leaves the current live snapshot untouched.
- Failure is visible and retryable when transient; permanently invalid work stays private with a clear administrator action.
- Strict types, lint, unit/database/browser checks and responsive screenshots pass. QA never stops the user's server on port 3107.
