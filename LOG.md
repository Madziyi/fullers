# Decision log

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
