# M2 — complete the public website

User approved the M1 design and authorized planning and implementing the next sections.

## Scope and sequence

1. Build crawlable, responsive `/about` and `/services`, grounded in the source inventory and existing design system. Reuse approved images, stats and contact settings. No invented company history, awards, delivery regions or specifications.
2. Build `/contact` with phone, WhatsApp, source location/map search and an accessible quote form. Product links can preselect a published product. Store minimal details privately: name, phone/email, message, optional product and consent timestamp. Explain collection inline and on a factual noindex enquiry notice; full approved privacy policy remains a release input.
3. Protect intake with server validation, signed expiring form tokens, a honeypot, same-origin checks, database-backed contact/global quotas and idempotent submissions. Share M1 throttle storage with distinct enquiry namespaces; no database migration is required. The write and rate counters are atomic. Never pretend that email notifications are sent.
4. Provide administrator-only enquiry list/detail reads so submissions are actionable. Full status management/export/deletion/user workflows remain M3. No public enquiry lookup/API.
5. Connect navigation/footer, homepage calls to action and product enquiry links to live pages. Update metadata, breadcrumbs and sitemap. Keep projects/blog hidden until real content and M3 publishing exist.
6. Verify validation/security units, real DB persistence, inbox authorization, duplicate/retry handling, spam/rate guards, complete public paths, keyboard/mobile behavior and axe checks. Capture screenshots and open a separate M2 PR. Do not deploy or start M3.

## Acceptance

- All new pages contain meaningful source-backed content in raw HTML, one H1, unique metadata/canonicals and relevant internal links.
- The form preserves typed details on validation/storage errors, gives field-level messages, requires contact permission and at least one usable contact method, and acknowledges only committed writes.
- Unknown/unpublished products are rejected. Seed-only mode cannot accept enquiries. Missing secrets/database errors fail safely without customer data in logs.
- Repeated submission of the same signed form stores at most one enquiry; expired/tampered/cross-origin/bot/over-quota requests store none.
- Public visitors and editor accounts cannot read enquiries. Stored messages render as escaped text.
- Existing M1 tests pass alongside new desktop/mobile screenshot and accessibility checks. CI uses disposable data only.

## Open inputs and release boundary

Receiving email/provider, privacy policy/retention approval, image rights, detailed product specifications, delivery coverage and original WhatsApp-link verification remain open. Enquiries are stored for authorized administrator review; no email delivery dependency blocks this local M2 slice. Retention/deletion automation and internet-facing edge throttling belong to release hardening.

Branch from reviewed M1. If PR #1 is still open, stack M2 against that branch; do not merge M1 on the user's behalf. Preserve user-run local preview processes; use separate build output for QA when needed.
