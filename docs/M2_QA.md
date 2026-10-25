# M2 review evidence

## Implemented

- Source-backed, server-rendered About, Services and Contact pages connected to header/footer navigation. Homepage/company and product/quote links use the new pages; the quote form supports a published product selection.
- Optional phone or email, name, bounded message, explicit permission, helpful field errors, preserved inputs and a stored-only confirmation. Signed two-hour form tokens, honeypot, same-origin enforcement, database quotas and atomic idempotent writes. No email notifications claimed or sent.
- Administrator-only paginated inbox and detail views. Public visitors are redirected to sign-in; editor accounts get a 404 without enquiry content. Messages are rendered as escaped text.
- Mobile navigation closes after selecting a page and on Escape, returning focus to its toggle. New page metadata, breadcrumb schema and sitemap entries. Factual enquiry notice is noindex and excluded from the sitemap pending the final approved privacy policy.

## Checks

- 26 unit tests passed, including nine new validation/token/intake tests.
- PostgreSQL integration passed: concurrent retry idempotence, permission timestamp, contact quota under concurrent submissions, honeypot and origin rejection, and cleanup of disposable customer fixtures.
- Production build, lint and strict TypeScript passed. All 16 desktop/mobile browser tests passed (1.0 minute), with no skipped tests. Selected axe WCAG A/AA checks reported zero violations on About, Services, Contact and private enquiry detail at both viewport sizes, alongside the M1 route scans. Final enquiry wording was refreshed and its dedicated browser checks repeated.

## Operational notes

M2 reuses LoginThrottle with `enquiry:global` and `enquiry:contact:<HMAC>` namespaces; the existing unsalted login keys cannot collide with these. Enquiry counters and writes run in one PostgreSQL transaction. Quotas allow 50 total successful enquiries per 15-minute global window and three per submitted email/phone per 15-minute contact window. Replays of the same accepted token return success without consuming quota. Failed writes/blocked submissions roll counters back. This is intake protection, not a replacement for edge/IP protection before internet release.

The administrator inbox uses cursor pagination (25 records/page), soft-deletion filtering and server-side authorization before querying private data. No new public record API or email service is introduced. Full inbox management, retention/deletion automation and notifications are separate future work; approved privacy/retention wording and a receiving email/provider remain release inputs.

Use a disposable seeded database for tests. Disposable browser administrators avoid consuming the local owner account’s login quota; accounts and their settings-test audit entries are cleaned up. Real enquiry fixtures use `example.test` addresses and are removed by the integration/browser suites. Do not run tests against a customer/production database.

For concurrent local development and QA, set `NEXT_BUILD_DIR=.next-review`, `PLAYWRIGHT_PORT=3117` and both URL variables to `http://127.0.0.1:3117` for the review build/test process only. CI uses the normal `.next` output and dedicated port 3107. Do not reuse an unknown running server or stop a user-run preview to test.

## Remaining

- M3 full CMS and article editing/publishing, autosave, previews, SEO guidance, scheduling and revisions.
- M4 approved privacy/retention policy, notification destination/provider, production security/monitoring/backup work, original WhatsApp verification and staging/UAT.
- Company-provided product specifications, three missing photographs, photo rights, actual delivery coverage and award details remain unconfirmed. No production deployment or old-site changes.

## Screenshots

- [About desktop](screenshots/m2-about-desktop.png) / [mobile](screenshots/m2-about-mobile.png)
- [Services desktop](screenshots/m2-services-desktop.png) / [mobile](screenshots/m2-services-mobile.png)
- [Contact desktop](screenshots/m2-contact-desktop.png) / [mobile](screenshots/m2-contact-mobile.png)
- [Private enquiry desktop](screenshots/m2-enquiry-desktop.png) / [mobile](screenshots/m2-enquiry-mobile.png)

Automated accessibility is not a complete screen-reader/keyboard audit or a claim of WCAG conformance. No field CWV, production backup/restore, email delivery or hosted CI success is claimed in this local evidence document; hosted checks are available on the PR.
