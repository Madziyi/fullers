# Fullers engineering rules

Read SPEC.md and CONTENT_AND_ASSET_INVENTORY.md first. This is a greenfield Next.js application and custom CMS. No WordPress, CMS products, invented specifications, prices, projects, testimonials or stock images. Preserve approved statistics and award-winning wording. Never deploy or modify the old website without explicit authorization.

Use strict TypeScript, server-rendered public content and server-side authorization for every admin read/mutation. Never trust client role claims. Store structured content, not arbitrary HTML. Keep credentials out of Git. No default admin password. Do not silently use seed content on database failure. Keep drafts out of public queries, metadata and sitemap. M1/M2/M3A review gates are complete. The user authorized completion of all remaining M3 slices on October 25, 2026; implementation is on codex/m3-cms-completion, stacked on M3B. See docs/M3_COMPLETION_PLAN.md and docs/M3_COMPLETION_QA.md. User does not require revision restore UI. Schedule jobs must bind to a saved content version and refuse publication if the draft changes.

Update NOW.md, TASKS.md and LOG.md with each meaningful slice. Run lint, typecheck, unit tests, production build and relevant browser checks. Record limits honestly. M3 owns full editing, scheduling and revision UX; M1 establishes models and access boundaries. Do not proceed to the next milestone before M1 review.

M1 design has been reviewed; M2 and M3A have separate review PRs. Follow the active milestone plan. Enquiry data is private and administrator-only; do not log personal information, expose public lookup endpoints or claim notification delivery without a configured provider. Preserve any user-run preview server. M3A is on `feat/m3a-article-workflow`; M3B is stacked on that branch. QA uses `.next-review` or another ignored build directory on a separate port. Keep generated-only `next-env.d.ts` changes out of commits. Scheduled publication is bound to the exact saved version; conflicts must remain private and visible.

Authentication forms must use POST even before hydration and remain disabled until the secure handler is ready. Verify login in both development and production: Webpack refresh needs development-only eval permission; production must never inherit it. Never log or repeat credentials from URLs. Redirect legacy credential query strings to a clean login URL.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
