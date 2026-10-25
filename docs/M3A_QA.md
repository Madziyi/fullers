# M3A verification record

M3A is implemented on `feat/m3a-article-workflow`. This record covers local verification only; the user-run preview on port 3107 was left running. No production service or cloud storage was provisioned.

## Verification

The final checks passed:

- `npm test`: 41 tests across 7 files.
- `npm run test:db`: database fixture checks plus 1 integration test. These verify clean seed/public visibility, rollback and publication constraints, the database rejection of a cross-post revision pointer, and that a rolled-back published-pointer swap leaves the current revision intact.
- `npm run typecheck` and `npm run lint`.
- `npm run build` with isolated output `.next-m3a-final`.
- `npm run test:e2e`: 18 tests across desktop and mobile, including admin, public M1/M2 regression, article workflow and accessibility checks.
- `npm run test:dev`: 2 development login regressions.

The article browser test creates disposable accounts and an article, then removes its rows and uploaded file. It verifies the public page remains at snapshot v1 while a v2 working copy is edited, publication advances the live pointer, and unpublishing returns the article and uploaded media to 404. It also checks private preview/noindex and axe accessibility, a real WebP upload roundtrip, malformed image rejection (400), cross-origin rejection (403), anonymous draft-media rejection (404), owner preview access (200), and disabled editor controls during a delayed publish response. Unit action tests cover editor publish/unpublish denial, another author's draft, stale CAS predicates, and cross-article upload assignment.

## QA commands

Use a separate output directory and port so local QA does not contend with the preview on 3107. The production public URL is inlined during `next build`, so set both URLs before building and again for tests:

```powershell
$env:NEXT_BUILD_DIR = '.next-m3a-final'
$env:NEXT_PUBLIC_SITE_URL = 'http://127.0.0.1:3117'
$env:NEXTAUTH_URL = 'http://127.0.0.1:3117'
npm run build
$env:PLAYWRIGHT_PORT = '3117'
npm run test:e2e

$env:NEXT_BUILD_DIR = '.next-review'
npm run test:dev
```

The test scripts generate the custom Prisma client. The client uses Prisma 6.19.3 with `engineType = "client"` and `@prisma/adapter-pg`, so generation does not replace a native engine DLL loaded by the preview server. Database checks use disposable QA records and the existing local PostgreSQL connection; never print credentials or check `.env` into Git.

## Screenshots

- [Desktop article editor](screenshots/m3a-editor-desktop.png)
- [Mobile article editor](screenshots/m3a-editor-mobile.png)
- [Desktop authenticated preview](screenshots/m3a-preview-desktop.png)
- [Mobile authenticated preview](screenshots/m3a-preview-mobile.png)

## Limits retained for later slices

M3A stores media under ignored local `.local-media/article/` paths, validates and optimizes uploaded image bytes, and serves them only when a current published snapshot references the file or an authorized editor/admin previews an attached draft. A durable production object-storage adapter, retention/quota policy and provider configuration remain release/M3C decisions; local storage is not claimed as a production deployment setup.

The editor intentionally omits tables, FAQ and code blocks. M3B remains responsible for Zimbabwe-time scheduling operations, a reliable worker with retry/missed-job handling, and user-facing revision browsing/restore. Product CMS/media-library management, page sections, project approvals, enquiry workflows, redirects, user administration and audit UI remain M3C/M3D. There are no seeded or fake public articles and no automatic publication from a failed database read.
