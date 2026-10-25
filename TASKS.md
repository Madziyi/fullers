# Milestone board

- [x] M1: schema, migration and safe seed
- [x] M1: authentication, role boundary and custom admin shell
- [x] M1: responsive homepage, shared navigation/footer and product catalogue
- [x] M1: crawlable metadata, sitemap and robots
- [x] M1: lint, types, unit/integration checks and responsive screenshots
- [x] M1: open review PR with hosted CI configured
- [x] M2: complete about, services and contact enquiry workflow
  - [x] Repair development login hydration and prevent credential GET fallback; add dev-mode CI checks
  - [x] Plan and source-backed page designs
  - [x] Validated private enquiry intake with spam/rate/retry protection
  - [x] Administrator inbox reads and connected public navigation
  - [x] Desktop/mobile/accessibility/security checks and screenshots
  - [x] M2 review PR opened with hosted CI configured: [#2](https://github.com/Madziyi/fullers/pull/2)
- [ ] M3: custom CRUD, rich-text editor, SEO guidance, preview, autosave, scheduling, revisions, audit
- [ ] M4: staging, release hardening, backups/restore, redirects review and CWV/UAT

## Remaining inventory

- M2 public pages and guarded enquiry workflow are delivered. Email notifications, full inbox management and retention/deletion automation remain future work.
- M3: content CRUD, media workflows, controlled page sections, editor accounts/roles, enquiry and redirect administration. Build the complete nontechnical article editor, practical SEO checks, product links, autosave, authenticated noindex previews, publish/unpublish, dependable scheduling, revisions/rollback and publication audit/cache invalidation.
- M4: verified legacy redirect map, privacy approval, staging setup, MFA/recovery and edge throttling, media/security review, monitoring, backup/restore exercise, real CWV and full keyboard/screen-reader/UAT review. Only deploy with explicit authorization.
- Fullers inputs: product sizes/specifications, three missing product photos, imagery rights/attribution, delivery regions, award detail, privacy text and enquiry recipient. Verify supplied WhatsApp number against original link before release.
- M1 handoff: [PR #1](https://github.com/Madziyi/fullers/pull/1) open; final local regression and screenshots complete. Hosted CI status is shown on the PR. M1 design was reviewed; stop after M2 review handoff before M3.
