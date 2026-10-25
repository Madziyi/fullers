# M3 implementation discussion — draft

Status: M3A is implemented and reviewed in PR #3; the user has authorized M3B. M1/M2 public pages, enquiry intake and administrator inbox are implemented. Preserve the running local preview and existing generated next-env.d.ts changes.

## Intended outcome

A nontechnical administrator can write a useful article, understand practical SEO advice, preview the real page, publish or schedule it, and connect it to relevant products. Drafts and example content never appear publicly. Keep the custom Next.js admin; no CMS product or arbitrary HTML page builder.

## Proposed reviewable slices

| Slice                                   | Working outcome                                                                                                                                                                                                                                                                                                                           | Review evidence                                                                                                                                                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M3A: complete article workflow          | Article list; clean structured editor; title/slug/excerpt/author/category/tags; cover selection and bounded image upload; autosaved draft with visible status; product links; actionable SEO sidebar/search illustration; authenticated actual-page preview; publish/unpublish; public blog hub/detail and relevant product article links | Create a draft, recover it after reload, correct validation issues, preview, publish, verify crawlable public HTML and sitemap, unpublish and verify removal; unauthorized publishing rejected           |
| M3B: publishing reliability             | UTC-backed scheduling with explicit display timezone; authenticated reliable worker entry point; due-job idempotence/retries; clear missed/failed schedule state; optimistic conflict detection; edits after scheduling require review                                                                                                       | Two editors cannot silently overwrite changes; a scheduled record stays private until promotion; repeated jobs do not duplicate publication; conflicting scheduled edits never publish unexpectedly     |
| M3C: catalogue and media administration | Seven product editors; verified specifications only; image/alt/provenance controls; related products/FAQs/SEO; media library with upload validation and optimized variants; replacement/crop/focal point workflow                                                                                                                         | Update a product and confirm public output; reject unsafe/oversized uploads; missing-photo state clears only after a valid image is assigned; references survive safe replacement                        |
| M3D: remaining administration           | Controlled page-section editing, approved real projects, enquiry status management, redirects with loop checks, expanded settings, account/role controls and audit view                                                                                                                                                                   | Role checks on every operation; no project published without approval; safe redirects; meaningful destructive-action confirmations and history                                                           |

Confirmed first PR: M3A as a complete vertical slice, with only the media capabilities it needs. Keep future controls out of the active UI until functional.

M3A is implemented on `feat/m3a-article-workflow`. It includes separate working drafts and immutable published snapshots, safe structured editing, private uploads, authenticated preview, publication/unpublication and crawlable public article routes. Its explicit deferrals remain M3B scheduling reliability, plus tables/FAQ/code formats. The user confirmed revision restore/history UI is not required for M3B.

## Writing experience

- Main writing area with a compact formatting toolbar. Start with paragraphs, H2/H3, lists, quotes, links and images/captions. Tables/FAQ blocks and other specified formats must remain on the milestone checklist; document any format deferred from the first slice explicitly.
- Clear saved/saving/retry/conflict states. Debounced autosave after changes, with a server version check; no silent loss on connection failure or navigation.
- Separate publication state from draft edits. Editing a live article must not silently change the public version. The existing Post version and revision foundations need an explicit working-copy/published-snapshot design before implementation.
- Preview uses the actual public renderer, behind authentication with noindex and no-store. Do not introduce public preview tokens in the first slice.
- SEO sidebar groups publication blockers separately from suggestions. Explain missing description, heading structure, image alt, broken links and relevant product links. Search previews are illustrative; no keyword-density score or ranking guarantee.
- Suggest links from existing titles/taxonomy. The editor approves every insertion. No automatic link stuffing or external AI integration is needed.

## Schema and service work to settle before coding

1. Define and validate the allowlisted rich-text JSON format and safe public renderer. Restrict URLs, embeds and media types. No stored raw HTML.
2. Define working draft versus published snapshot, slug changes/redirect behavior, revision boundaries and optimistic conflict semantics. Avoid a revision for every keystroke; use meaningful saved versions and explicit publication/restore snapshots.
3. Define server-side publish validation, role policy, audit transaction, publication dates and public query filtering. Publishing updates relevant article/product pages and sitemap visibility.
4. Define a storage interface with local development support and a replaceable production adapter. Choose production storage before release; do not bind application content to machine-specific file paths. Validate actual file content as well as MIME and size.
5. Define scheduling worker contract and job authorization. Local tests can invoke the same worker logic deterministically; real scheduling requires a configured dependable scheduler, never a browser timer or a success-looking control with no job runner.
6. Confirm whether categories/tags can be managed by editors and how published slug changes are approved. Prefer a warning plus an audited redirect for intentional slug changes.

## Confirmed discussion decisions

- First slice: article editing and publishing.
- Role policy: editors draft; administrators publish.
- Scheduling display: Zimbabwe local time (`Africa/Harare`), explicitly labelled; dates stored in UTC. Operational scheduling arrives in M3B.
- M3B includes dependable authenticated processing, safe handling for edits after scheduling, retries and actionable failure states. User does not require revision restore/history UI.
- Hosting/storage/scheduler provider remains an open deployment decision. Do not claim scheduled delivery is operational until a dependable production cron calls the authenticated worker.

The M3A plan brings optimistic conflict protection and separation of live content from draft changes into the first slice; these are core data-safety requirements, not later enhancements.

## Definition of done for each slice

Strict types, lint, relevant unit/database integration tests, production and development browser coverage, desktop/mobile and selected accessibility checks. Tests include malicious structured content, unauthorized writes, publication boundaries and data-loss scenarios. Capture representative screenshots, update AGENTS.md/NOW.md/TASKS.md/LOG.md, and provide a focused PR with remaining tasks. No production deployment or changes to the old website.
