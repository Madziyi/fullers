# Fullers Aggregate

Greenfield Next.js website and bespoke content studio. M1 includes the responsive public homepage, shared chrome, seven-product catalogue/detail routes, PostgreSQL foundation, protected custom administrator shell and editable site settings. No CMS product or legacy template code is used.

Read [SPEC.md](SPEC.md), [asset inventory](CONTENT_AND_ASSET_INVENTORY.md), [CMS schema](docs/CMS_SCHEMA.md) and [local setup/operations](docs/OPERATIONS.md). [NOW.md](NOW.md), [TASKS.md](TASKS.md) and [LOG.md](LOG.md) track scope and remaining work.

Quick public preview: `npm ci`, copy `.env.example` to `.env`, keep `CONTENT_SOURCE=seed`, set a local `NEXTAUTH_SECRET`, then `npm run dev`. For the real database and admin workflow, follow the operations guide. Article writing/publishing, media uploads and full content CRUD arrive in M3.

Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:db`, `npm run build`, `npm run test:e2e`. Database/browser checks use an isolated seeded database. CI repeats the checks against PostgreSQL 17.

No production deployment, old hosting changes or automatic legacy redirects.
