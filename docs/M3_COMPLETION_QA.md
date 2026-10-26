# M3 completion verification

The user authorized all remaining M3 work and final admin/CMS UI cleanup on October 25, 2026. Branch: `codex/m3-cms-completion`, based on M3B. No deployment or old-site changes.

## Delivered

- Product CRUD, related products, source-backed structured details, specifications/FAQ row editors, SEO, explicit publication, optimistic conflict checks, private preview and archive.
- Administrator media library: bounded decoded JPEG/PNG/WebP upload, private originals and optimized WebP output, source/alt/dimensions, focal/crop preview, metadata audit and reference-aware archive. Replacement uploads a new asset and changes the content selection; referenced original bytes remain intact.
- Controlled 1–20 page sections, inline validation, private preview and publication conflict checks. Home/About/Services retain approved source content and show supplemental published sections. Custom pages use `/pages/[slug]`.
- Real-project editor with date, photos, products, client-name permission, private preview and explicit approval. Saves return projects to private draft; public reads require publication plus approval. Photos need descriptive alt before approval.
- Administrator enquiry statuses, safe same-site redirect CRUD/chain/cycle checks and resolution for legacy paths, user creation/access controls and paginated audit history. No enquiry content/account contact details in operation audit payloads.
- Article tables, FAQ/code, block ordering, canonical/social controls, search guidance and explicit suggestions from published articles; taxonomy filters and related reading. Existing exact-version scheduling and publication snapshots retained. User excluded revision restore/history UI.
- Shared content studio navigation, current dashboard, responsive forms/tables, focus states and media cards.

## Verification

- Lint and strict typecheck: passed.
- Unit suite: 76 tests across 13 files passed.
- PostgreSQL integration: seed/public visibility, rollback/unique-slug/publication constraints and worker/concurrency suite passed (3 integration tests). Local sandbox initially denied the QA localhost connection; the authorized local elevated run passed.
- Final isolated production build: passed with all CMS/public routes and legacy fallback.
- Development login: 2/2 passed on port 3119, including POST-only/no-JavaScript safety and development CSP hydration.
- Final desktop/mobile browser verification: all 28 checks passed across the final run and targeted rerun. The complete run passed 23; five desktop checks exceeded the old five-second/45-second deadlines under local resource contention, then all five passed against the identical build with 15-second assertions/90-second test deadlines. All 14 mobile checks passed, including original-image byte preservation and guest rejection.

The initial browser pass found and prompted fixes for upload UUID validation, form-test timing/selector issues, and keyboard focus on mobile code/table scroll regions. Final results below must refer to the corrected build.

Screenshots: `docs/screenshots/m3-studio-{admin,products,media}-{desktop,mobile}.png`; `m3-product-editor-*` and `m3-project-editor-*` show the editing forms; article and schedule screenshots were also refreshed by the browser suite. Desktop/mobile dashboard and product-editor images were visually reviewed. Original-source downloads are administrator-only; browser coverage compares source bytes and rejects guests.

## Reproduce isolated QA

```powershell
$env:NEXT_BUILD_DIR = '.next-m3-final'
$env:NEXTAUTH_URL = 'http://127.0.0.1:3127'
$env:NEXT_PUBLIC_SITE_URL = 'http://127.0.0.1:3127'
npm run build
$env:PLAYWRIGHT_PORT = '3127'
npm run test:e2e
npm run test:dev
npm run lint
npm run typecheck
npm test
npm run test:db
```

Use only the disposable local/CI database. These tests create temporary records and clean them up. The user preview on port 3107 is preserved. Generated-only next-env.d.ts and temporary build/type include changes are excluded from commits.

## Release limits

No production scheduler, hosting, durable storage or notification service was configured. The protected publication worker still requires a dependable hosting trigger and secret before automatic scheduling operates in production. Local uploads use ignored `.local-media`; choose persistent storage/backups before release. Business approvals/technical specifications, photo rights/missing photos, privacy/retention, MFA/recovery, edge throttling, monitoring, backup restore, CWV and final UAT remain M4/release inputs. Automated accessibility checks do not replace keyboard/screen-reader UAT.

Review publishing: automatic approval review rejected the push to https://github.com/Madziyi/fullers.git because it requires explicit approval for exporting this branch. The implementation and review package remain committed locally; no PR or hosted CI is claimed for this completion branch.
