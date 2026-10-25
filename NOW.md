# Current work

M3A review and authorization gates are complete. M3B publishing reliability is implemented on `feat/m3b-publishing-reliability`, stacked on `feat/m3a-article-workflow`; [PR #4](https://github.com/Madziyi/fullers/pull/4) is open and both hosted CI runs are green. Scope: administrator scheduling in Africa/Harare, UTC-backed durable jobs, a protected worker with bounded retries, and exact-version conflict review. The user explicitly does not require revision restore UI. Plan and QA evidence: `docs/M3B_PLAN.md` and `docs/M3B_QA.md`.

Login follow-up: repaired the development CSP that blocked hydration, added POST-only/pre-hydration-safe login, stripped legacy credential query strings and suppressed those request logs. Added development login regression coverage to CI. The exposed localhost QA password is replaced in ignored .env; use the current ADMIN_PASSWORD entry rather than terminal/chat history. M2 features and review boundary are unchanged.

M2 is implemented on `feat/m2-public-pages`, based on the reviewed M1 branch. The user approved the M1 local design and authorized the next public sections. See docs/M2_PLAN.md and docs/M2_QA.md.

Delivered: source-backed About, Services and Contact pages; connected navigation, product-selected quote form, metadata/breadcrumbs/sitemap; validated private enquiry intake with consent, signed tokens, honeypot, origin checks, atomic database quotas and idempotence; administrator-only paginated inbox/detail reads.

Validation: 26 unit tests, PostgreSQL integration/concurrency/constraint checks, production build, lint and strict types pass. All 16 desktop/mobile browser tests pass, including selected WCAG A/AA scans on the new pages and private enquiry detail. Review screenshots are in docs/screenshots/. The final review build and screenshots are included in [M2 PR #2](https://github.com/Madziyi/fullers/pull/2). Hosted CI status is shown on that PR.

M1 PR: https://github.com/Madziyi/fullers/pull/1. M2 is stacked on the M1 branch while that PR remains open; no merge is performed implicitly. Preserve the user's dev preview; QA uses .next-review and a separate port.

Validation for M3A: 41 unit tests, database integration and the article revision/FK rollback checks, typecheck, lint and production build passed. Full production browser suite passed 18/18 (desktop/mobile), including editor, live snapshot update, unpublish, private preview/accessibility and upload privacy; development login suite passed 2/2. QA evidence and safe commands are in [docs/M3A_QA.md](docs/M3A_QA.md); screenshots are in docs/screenshots/m3a-editor-{desktop,mobile}.png and docs/screenshots/m3a-preview-{desktop,mobile}.png. QA used isolated build and ports 3117/3119; the user preview at 3107 was preserved. PR #3 contains screenshots, QA evidence and remaining tasks; hosted CI is tracked on the PR. No production/old-site changes were made.

M3B validation: unit tests, database worker/concurrency tests, production build, strict types/lint and desktop/mobile Playwright all pass; screenshots are in `docs/screenshots/m3b-schedule-{desktop,mobile}.png`. The live preview on port 3107 was preserved. A production hosting scheduler and `PUBLISH_WORKER_SECRET` still need configuration before scheduled jobs execute automatically. No production deployment or old-site changes.

Next review boundary: M3C product editing and media library management. Tables/FAQ/code article formats, page sections, project approvals, enquiry management, redirects, user/role UI and audit browser remain future work. Do not start M3C until M3B review; no production deployment or old-site changes.

Open inputs: receiving email/provider, approved privacy/retention policy, photo rights and missing photos, verified product specifications/delivery regions, award detail and original WhatsApp link. Enquiries are stored for administrators; no notification delivery is configured or claimed.
