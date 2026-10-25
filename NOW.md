# Current work

Login follow-up: repaired the development CSP that blocked hydration, added POST-only/pre-hydration-safe login, stripped legacy credential query strings and suppressed those request logs. Added development login regression coverage to CI. The exposed localhost QA password is replaced in ignored .env; use the current ADMIN_PASSWORD entry rather than terminal/chat history. M2 features and review boundary are unchanged.

M2 is implemented on `feat/m2-public-pages`, based on the reviewed M1 branch. The user approved the M1 local design and authorized the next public sections. See docs/M2_PLAN.md and docs/M2_QA.md.

Delivered: source-backed About, Services and Contact pages; connected navigation, product-selected quote form, metadata/breadcrumbs/sitemap; validated private enquiry intake with consent, signed tokens, honeypot, origin checks, atomic database quotas and idempotence; administrator-only paginated inbox/detail reads.

Validation: 26 unit tests, PostgreSQL integration/concurrency/constraint checks, production build, lint and strict types pass. All 16 desktop/mobile browser tests pass, including selected WCAG A/AA scans on the new pages and private enquiry detail. Review screenshots are in docs/screenshots/. The final review build and screenshots are included in [M2 PR #2](https://github.com/Madziyi/fullers/pull/2). Hosted CI status is shown on that PR.

M1 PR: https://github.com/Madziyi/fullers/pull/1. M2 is stacked on the M1 branch while that PR remains open; no merge is performed implicitly. Preserve the user's dev preview; QA uses .next-review and a separate port.

Next review boundary: M3 full article editor and custom CMS workflows. Do not continue automatically. No production deployment or old-site changes.

Open inputs: receiving email/provider, approved privacy/retention policy, photo rights and missing photos, verified product specifications/delivery regions, award detail and original WhatsApp link. Enquiries are stored for administrators; no notification delivery is configured or claimed.
