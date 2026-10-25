# M2: finish public pages and private enquiry flow

Customers can now learn about Fullers, understand supply/delivery conversations and request a quote without leaving the website. Adds responsive server-rendered About, Services and Contact pages, connects navigation and product enquiry links, and extends metadata, breadcrumbs and sitemap. Copy uses only approved business facts and bundled imagery; no specifications, prices, delivery coverage, projects or testimonials are invented.

The quote form validates on the server, preserves input, requires permission and at least one contact method, and confirms only stored enquiries. Signed expiring forms, a honeypot, origin checks, database quotas and atomic idempotence protect intake. A paginated administrator-only inbox/detail view makes saved enquiries available privately. Public visitors must sign in; editors cannot access the records. Stored messages are escaped. Email notifications are not configured or claimed.

## Plan, evidence and screenshots

See [M2 plan](M2_PLAN.md) and [M2 QA](M2_QA.md). Local validation includes strict types/lint, 26 unit tests, real PostgreSQL concurrency/quota checks and production build; all 16 desktop/mobile browser tests pass, including automated accessibility scans on the new pages and administrator detail. CI repeats the complete suite against disposable PostgreSQL.

![Contact page](https://github.com/Madziyi/fullers/blob/feat/m2-public-pages/docs/screenshots/m2-contact-desktop.png?raw=true)

![About page](https://github.com/Madziyi/fullers/blob/feat/m2-public-pages/docs/screenshots/m2-about-desktop.png?raw=true)

Desktop/mobile Services, Contact, About and enquiry-detail screenshots are included in the branch. No production deployment or old-site changes.

## Scope and remaining work

Stacked on the reviewed M1 branch while PR #1 remains open; do not merge or deploy as part of this task. After M1 lands, retarget this PR to main as appropriate.

M3 remains the full custom CMS/article editor, practical SEO guidance, product links, autosave, authenticated previews, publish/schedule and revisions/rollback. Further inbox management, notifications and retention/deletion automation remain future work. Before release, approve privacy/retention wording, select a notification recipient/provider, finish edge throttling/recovery/MFA/monitoring/backups, verify delivery/product details and missing photo rights, and run staged UAT/CWV checks. The factual form notice is noindex and does not replace the final approved privacy policy.
