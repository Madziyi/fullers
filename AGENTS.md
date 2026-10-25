# Fullers engineering rules

Read SPEC.md and CONTENT_AND_ASSET_INVENTORY.md first. This is a greenfield Next.js application and custom CMS. No WordPress, CMS products, invented specifications, prices, projects, testimonials or stock images. Preserve approved statistics and award-winning wording. Never deploy or modify the old website without explicit authorization.

Use strict TypeScript, server-rendered public content and server-side authorization for every admin read/mutation. Never trust client role claims. Store structured content, not arbitrary HTML. Keep credentials out of Git. No default admin password. Do not silently use seed content on database failure. Keep drafts out of public queries, metadata and sitemap.

Update NOW.md, TASKS.md and LOG.md with each meaningful slice. Run lint, typecheck, unit tests, production build and relevant browser checks. Record limits honestly. M3 owns full editing, scheduling and revision UX; M1 establishes models and access boundaries. Do not proceed to the next milestone before M1 review.

M1 design has been reviewed and M2 authorized. Follow docs/M2_PLAN.md for the public-page/enquiry slice. Enquiry data is private and administrator-only; do not log personal information, expose public lookup endpoints or claim notification delivery without a configured provider. Preserve any user-run preview server. M3 remains a separate review boundary.
