# Decision log

## M2 start

- User approved the local M1 design and authorized the next sections. Scoped M2 to remaining public pages and a complete private enquiry workflow; M3 publishing remains deferred.
- Planned signed expiring forms, consent, shared PostgreSQL throttle storage with namespaced keys, atomic writes and idempotence. No migration or external email dependency is needed.
- Preserve the user's running preview and generated next-env changes. M2 review uses separate build output where needed; no deployment or implicit M1 merge.

## 2026-10-24

- Confirmed the source folder contains only requirements and six approved WebP images, no application or Git remote.
- Selected Next.js App Router, Prisma/PostgreSQL and Auth.js credentials sessions for M1. Custom admin UI; no CMS product.
- Approved seed catalogue supports explicit local preview without a database. Deployed database mode must fail visibly on errors rather than substitute seed data.
- Projects, testimonials and unapproved manager statement are excluded. No technical dimensions, pricing or availability claims will be added.
- Designed the full CMS entity contract in docs/CMS_SCHEMA.md before application implementation; included publication checks, unique slugs, UTC timestamps, JSON content, revisions, media provenance, settings, enquiries, redirects and audit foundations.
- Implemented public server-rendered catalogue queries, safe seed preview opt-in and seven approved published product categories. Missing images have accessible labelled fallbacks; original assets are copied unchanged.
- Implemented custom administrator shell, active-account checks, database-backed login throttling, role-checked settings mutations, server validation, atomic audit and public layout invalidation.
- Configured the user-supplied empty Madziyi/fullers remote. Pushed the source handoff to main and created feat/m1-foundation for review.
- Used an isolated loopback PostgreSQL process for migration, seed, transaction rollback/constraint tests and actual sign-in/settings browser workflows. No Docker daemon or system service changes.
- Dependency audit initially reported six tooling/transitive advisories. Updated Vitest and overrode deepmerge-ts to its fixed major; Prisma generation, migrations and checks pass. Final audit reports zero vulnerabilities.
- Next.js Turbopack junction creation is restricted by this Windows sandbox. Selected the supported Webpack build. Stop the server before regenerating Prisma on Windows to avoid a loaded-DLL lock; rebuild with access to existing output when needed.
- First functional browser suite: ten tests passed on desktop/mobile. Added axe checks; corrected contrast in supporting contact/sector text and removed mismatched accessible link overrides. Final regression is being refreshed.
- The old source page was inaccessible and no MHT file was bundled. WhatsApp uses the supplied number in international digit format; original link verification and old redirect mapping remain release tasks.

- Final validation: strict types, ESLint, 17 unit tests, database integration, idempotent seed and production build passed. All 12 desktop/mobile Playwright tests passed; selected WCAG A/AA scans report zero violations. Refreshed screenshots committed for review.
- Isolated E2E on port 3107 with server reuse disabled after a separate local application occupied 3000; no unrelated process was stopped.

- Opened and attached https://github.com/Madziyi/fullers/pull/1 with review screenshots, validation and remaining tasks. GitHub Actions is running; no merge, deployment or next-milestone work performed.

- M2 validation: 26 unit tests and real PostgreSQL concurrent retry/quota checks passed. All 16 desktop/mobile browser tests passed, covering saved enquiries, input preservation, XSS-safe rendering, admin/editor/public access and new-page accessibility. Updated screenshots and metadata; no customer fixtures remain.

- Closed the mobile dropdown on page selection and Escape; added browser assertions for both. User-run preview/database processes were not stopped.

- Repeated M1 settings browser tests consumed the shared local QA admin login quota. Replaced that test account with disposable per-run administrators and cleaned only the QA-consumed local throttle entry; application rate limits remain unchanged.

- Final M2 regression: all 16 browser tests passed after disposable admin fixtures and mobile menu assertions. Production build, strict types, lint, 26 unit tests and PostgreSQL integration passed. Pre-existing generated next-env.d.ts dev imports are preserved and excluded from the M2 commit.
