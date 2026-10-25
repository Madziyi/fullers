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
  - [x] Confirm first slice, publication roles and scheduling timezone
  - [x] Prepare M3A implementation plan (docs/M3A_PLAN.md)
  - [x] Implement M3A article workflow; review is pending on `feat/m3a-article-workflow`
  - [x] Verify publication snapshots, role ownership, media privacy, autosave conflicts and publication actions
  - [x] Run production desktop/mobile public, admin, article, preview, media and accessibility checks
  - [x] Capture representative editor and private-preview screenshots
  - [ ] Parent review and PR packaging; do not merge implicitly
- [ ] M4: staging, release hardening, backups/restore, redirects review and CWV/UAT

## Remaining inventory

- M2 public pages and guarded enquiry workflow are delivered. Email notifications, full inbox management and retention/deletion automation remain future work.
- M3A delivered locally: structured article drafts, immutable publication snapshots, private uploads, SEO guidance, product links, autosave, authenticated preview, admin-only publish/unpublish and public blog relationships. Tables/FAQ/code formats, scheduling, operational revision browsing/restore, product CMS, page sections, project approvals, enquiry management, redirects, user/role UI and audit browser remain future work.
- M4: verified legacy redirect map, privacy approval, staging setup, MFA/recovery and edge throttling, media/security review, monitoring, backup/restore exercise, real CWV and full keyboard/screen-reader/UAT review. Only deploy with explicit authorization.
- Fullers inputs: product sizes/specifications, three missing product photos, imagery rights/attribution, delivery regions, award detail, privacy text and enquiry recipient. Verify supplied WhatsApp number against original link before release.
- M1 handoff: [PR #1](https://github.com/Madziyi/fullers/pull/1) open; M2 is stacked on the reviewed M1 branch. M3A is now a separate branch and review boundary.
