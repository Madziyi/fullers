# Milestone board

- [x] M1: models/migrations, authentication and role boundaries, public/admin shells, approved catalogue, CI and review PR #1
- [x] M2: About/Services/Contact, guarded private enquiry intake/inbox, responsive/accessibility QA and review PR #2
- [x] M3A: structured article editor, autosave/conflicts, private preview/uploads, immutable publication snapshots, SEO guidance, publish/unpublish and review PR #3
- [x] M3B: Harare/UTC schedule controls, exact-version jobs, protected worker/retries/idempotence, conflict review and review PR #4
- [x] M3C: product CRUD, structured specifications/FAQs, related products, SEO, private preview, explicit publication and conflict checks
- [x] M3C: media upload/library, provenance/alt/focal controls, privacy and safe image replacement/archive
- [x] M3D: controlled page sections, draft/publish/preview/archive and concurrent-save protection
- [x] M3D: real-project editing, media/products, client permission, administrator approval and public routes
- [x] M3D: enquiry status management, safe redirects and legacy path resolution
- [x] M3D: user/role administration and audit browser; no default passwords or audit PII
- [x] M3: table/FAQ/code formats, block reordering, social/canonical fields and approved link suggestions
- [x] M3: final admin/CMS navigation, dashboard, form/table and responsive UI cleanup
- [x] M3: production browser verification and local review package (see docs/M3_COMPLETION_QA.md)
- [ ] Release configuration: production scheduler/worker secret and durable media storage before deployment
- [ ] M4: staging, release hardening, backups/restore, verified redirect map, CWV and final UAT

Revision restore/history UI is excluded by the user's decision. No production deployment or implicit PR merge.

## Release inputs and limits

Email notifications and retention/deletion automation await provider/policy decisions. Product sizes/specifications, three product photos, imagery rights/attribution, delivery regions, award details, privacy text and enquiry recipient remain Fullers inputs. No invented business claims, projects, testimonials, prices or stock imagery are published.

QA uses isolated output and ports. Preserve the user's preview and keep generated-only next-env.d.ts edits out of commits. Evidence and exact validation commands are in docs/M3_COMPLETION_QA.md.

- [x] User approved public branch export on October 26; pushed and opened [PR #5](https://github.com/Madziyi/fullers/pull/5). Hosted CI is pending; no merge or deployment.
