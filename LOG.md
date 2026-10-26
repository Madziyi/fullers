# Decision log

## M3A review handoff

Parent review completed after Luna high implementation. Published the feature branch and opened PR #3 (https://github.com/Madziyi/fullers/pull/3), stacked on M2, with screenshots, local validation and remaining M3 inventory. Hosted CI is tracked on the PR. No merge or deployment; the existing generated-only next-env.d.ts change remains local.

## M3A implementation — 2026-10-25

- Implemented the reviewed first slice on `feat/m3a-article-workflow`: safe structured article editing; taxonomy, author, slug, cover, approved products and SEO fields; autosave with CAS/version conflict and navigation handling; private uploads with actual decode/size/dimension limits; authenticated actual-renderer preview; administrator-only publish/unpublish; immutable snapshots; public blog list/detail and relevant home/product links.
- Kept all anonymous page data, metadata, sitemap and article image access bound to the validated currently published snapshot. Added unique locked public slugs and a composite database reference preventing cross-post revision pointers. Draft changes remain invisible until a new explicit publication. Public reads select only pointed revisions; unpublish revokes live article and media access.
- Centralized Prisma client creation with Prisma 6.19.3 `engineType=client` and `@prisma/adapter-pg`; generation no longer replaces or locks a native query-engine DLL used by the running preview. Added client generation to scripts/CI paths and applied the M3A migration locally.
- Explicit M3A deferrals: table, FAQ and code blocks; operational scheduling/history UI (M3B); product CMS and media library, page/project/enquiry/redirect/user/audit administration (M3C/M3D). No fake sample article or production content was added.
- Validation: 41 unit tests pass; database integration passes including cross-post revision FK rejection and rolled-back pointer swap; typecheck and lint pass; isolated production build passes. Production browser suite passes 18/18 across desktop/mobile, including publication-v2 snapshot regression, private preview axe checks, upload decode/origin checks and media visibility revocation. Development login regression passes 2/2. Representative populated editor/private-preview screenshots are in `docs/screenshots/`.
- QA used generated ignored build output `.next-m3a-final`, production port 3117 and development port 3119. The user's 3107 preview and PostgreSQL service remained available; disposable accounts, article/media fixtures were removed after tests. Parent review is pending; no PR or merge was performed.

## M3 discussion

- User requested discussion and planning of the next implementation after reviewing M2/login. Prepared a draft M3 breakdown, recommending an article-publishing vertical slice first. Publication roles and scheduling timezone remain proposed decisions, not approvals. No application changes or M3 implementation started.

## Local login repair

- Reproduced Webpack React Refresh failing under the production-style CSP in development. Enabled eval only for development; production retains its stricter script policy.
- Login now has an explicit POST action and is disabled before hydration. Legacy credential query strings redirect to the clean page and are excluded from development request logging.
- Verified the local account hash/configuration without displaying credentials. Replaced the exposed localhost-only QA password in ignored .env. Added development-mode login/inbox and unhydrated safety regression tests to CI; no authentication protections or roles were bypassed.
- Final login verification passed at the normal local origin after restarting only the verified Fullers dev process. Strict types, lint, 28 unit tests and two dedicated development browser tests passed. A production build passed with eval excluded; CI repeats production and development coverage. The final replacement password remains only in ignored local .env.

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

- Opened and attached M2 PR https://github.com/Madziyi/fullers/pull/2, stacked on the reviewed M1 branch. CI repeats all checks; no merge, deployment or M3 implementation performed.

- M3 discussion decisions confirmed: article editing/publishing first; editors draft, administrators publish; scheduling displays Africa/Harare with UTC persistence. Prepared docs/M3A_PLAN.md with publication snapshots, autosave/conflict boundaries, safe media, public article routes and acceptance checks. Planning only; no application implementation started.

## 2026-10-25 — M3B publishing reliability

- User authorized M3B on a branch stacked after M3A, explicitly excluded revision restore UI and required safe conflicting-edit behavior. Updated the M3 plan/agent guidance before implementation.
- Added a durable publication-job schema and migration. Admin scheduling uses an explicit Africa/Harare wall clock and UTC storage; schedules bind to a post version. Saved edits invalidate the pending version and leave the article private or preserve the current public snapshot.
- Added authenticated internal POST worker with bounded batch claims (`FOR UPDATE SKIP LOCKED`), exact-version validation, atomic immutable-snapshot promotion, idempotence and capped transient retries. Terminal conflicts/failures are visible in the editor/list. Production cron/provider and its secret remain unconfigured and documented as release work.
- Closed a manual-publish/worker race by rechecking the current published pointer after schedule locking; cancellation now reports a version conflict clearly.
- Verification passed: strict TypeScript, ESLint, 51 unit tests, PostgreSQL seed/constraint and worker integration tests, isolated production build, and all 20 desktop/mobile Playwright tests. Browser coverage verifies Harare scheduling, pre-publication privacy and conflict invalidation. Added `docs/M3B_QA.md` and desktop/mobile schedule screenshots. Isolated browser/build output used port 3117; the user's preview on 3107 was preserved.
- No revision browser/restore UI, production deployment, hosting scheduler or old-website changes were made. Opened and attached [M3B PR #4](https://github.com/Madziyi/fullers/pull/4), stacked on M3A; both GitHub Actions runs passed. No PR was merged.

## October 25, 2026 — remaining M3 authorized

The user authorized completion of all remaining M3 slices, with Luna high agents as needed, followed by admin/CMS UI cleanup. Added docs/M3_COMPLETION_PLAN.md. Work covers catalogue/media, pages/projects, administrator operations and remaining article formats; no deployment is authorized. Existing preview and generated next-env.d.ts are preserved.

## October 25, 2026 — M3C/M3D completion and content studio polish

Completed remaining M3 implementation with three Luna high agents: catalogue/media, pages/projects and administrator operations. Integrated the modules, reviewed authorization/publication boundaries and corrected stale-save timestamps, UUID media validation, user account payloads, unknown legacy redirect routing and concurrent access edits. Added semantic table/FAQ/code article formats, ordering, canonical/social fields, published-article suggestions and taxonomy browsing. Refreshed the shared dashboard, responsive navigation, forms, media cards and focus states.

Product/media/page/project management is administrator-only. Page/project saves return entries to private draft explicitly; publication and approval use saved-version checks. Uploaded image replacement keeps referenced original files, media archive checks references atomically, and public media requires a published article/product or approved project. Enquiry operation audits omit personal content; user creation hashes passwords and last-admin/self-change guards remain server-side.

Initial browser checks led to corrections for mobile scroll-region keyboard access, duplicate project status output and asynchronous/ambiguous test assertions. Final evidence is tracked in docs/M3_COMPLETION_QA.md. Revision restore UI remains excluded. Production scheduler/storage/providers and release checks remain M4 inputs. The user preview was preserved; no merge, deployment or old-site change.

Final local browser verification completed: 23 checks passed in the full run; the five desktop checks that exceeded older local deadlines all passed against the same production build with the adjusted deadlines. All 14 mobile checks passed, including original image preservation/private download. No functional failures remain. Lint, strict types, 76 unit tests, database/worker checks, production build and development login checks are recorded in the QA report. Two orphaned disposable editor fixtures from an initial test timing race were removed; content fixture counts returned to zero posts/projects/pages and seven approved products.

The completion branch is committed locally. Public pushing was rejected by automatic approval review even after the existing repository identity, public visibility, permissions and shared M3B base were verified; explicit approval for public source export is required. No alternate export path was used and no completion PR/hosted CI result is claimed.

## October 26, 2026 — M3 review publication approved

The user explicitly approved pushing codex/m3-cms-completion to the public Madziyi/fullers repository and opening its review PR. Pushed the verified implementation and responsive evidence, then opened PR #5 stacked on feat/m3b-publishing-reliability and attached it to this chat. Hosted CI is pending. Generated-only next-env.d.ts remains uncommitted. No merge, deployment or old-site change.
