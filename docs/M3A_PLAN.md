# M3A — article editor and publishing

Status: M3A implementation complete and awaiting review. The confirmed M3A scope is implemented and locally verified; M3B remains a separate review/authorization boundary.

## Confirmed decisions

- First workflow: article editing and publishing, before full product/media administration.
- Editors prepare drafts; only administrators publish. The same administrator restriction applies to unpublish, scheduling and restoring a revision to the live website.
- Scheduling displays Zimbabwe local time (`Africa/Harare`) with an explicit label. Persist UTC. The scheduling interface and dependable worker arrive in M3B, not as an inactive control in M3A.

## Deliverable

An administrator can create an article, write and format it, add an image and relevant product links, understand SEO guidance, autosave, preview the actual article page privately, publish it to the public blog and unpublish it. An editor can complete the drafting steps but cannot publish through either the UI or a direct server request.

## Implementation sequence

| Order | Work                                                                                                                                                 | Completion evidence                                                                                                                                                |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Extend the Post/Revision contract for separate working and published versions; validate migration and authorization rules before building the editor | Database tests prove that saving a working draft never changes live content; cross-post revision references are rejected                                           |
| 2     | Implement an allowlisted structured document schema and shared server-rendered article component                                                     | Unsupported nodes, scripts, unsafe URLs, malformed documents and oversized content are rejected; valid content produces semantic HTML                              |
| 3     | Add protected article list, creation and editing at `/admin/posts` and `/admin/posts/[id]`                                                           | Administrators see all records; editors work with their own drafts by default; unauthorized direct reads/writes fail                                               |
| 4     | Add the writing surface: title/slug/excerpt, author, category/tags, cover, paragraphs, H2/H3, lists, quotes, links and images/captions               | Accessible keyboard interactions; explicit field errors; no raw HTML editing; unique slug validation                                                               |
| 5     | Add only the media capabilities needed for articles: existing asset selection, bounded image upload, source/alt/caption entry and safe delivery      | Actual file type/size/dimensions are validated; generated storage keys cannot escape the storage root; unpublished uploads are not anonymously exposed             |
| 6     | Add debounced autosave with saved/saving/retry/conflict states and navigation protection                                                             | Reload recovers the saved draft; a failed save is visible; a stale version cannot overwrite a newer one                                                            |
| 7     | Add the SEO sidebar and approved internal product linking                                                                                            | Search title/description and illustrative preview; useful heading/alt/link guidance; no keyword-density score, ranking promise or automatic link stuffing          |
| 8     | Add authenticated preview at `/admin/posts/[id]/preview` using the public renderer                                                                   | Permission checked before draft reads; noindex/no-store; unauthenticated visitors cannot retrieve draft content                                                    |
| 9     | Add administrator publication/unpublication transactions and the public `/blog` and `/blog/[slug]` routes                                            | Atomic revision + publication pointer + audit; crawlable HTML, unique metadata, canonical/social fields, Article and breadcrumb schema, correct sitemap visibility |
| 10    | Connect approved article/product relationships, blog navigation and real published article sections                                                  | Product pages and homepage link only to published versions; editing draft relationships cannot leak into public output; no placeholder articles                    |

## Publication and data-safety rules

- Use immutable PostRevision snapshots as the proposed live content source, with an explicit published-version reference on Post. The public renderer reads the published snapshot; the editor reads the working draft. Validate the final relation/migration design before implementation.
- Capture the fields that affect public output together: article body, title, excerpt, author/byline, taxonomy, media/alt, product links and SEO. Do not read draft fields into an otherwise published page.
- Preserve a public slug separately from an editable draft slug. In M3A, lock the public slug after first publication; deliberate URL changes and audited redirect creation can land with the redirect workflow. A draft slug edit must never silently break a published URL.
- Version checks and safe editing of published content belong in M3A. M3B adds the history/rollback interface and scheduling; core protection from silent overwrites is not deferred.
- Autosave updates the working copy and its version. Explicit save/publication creates meaningful snapshots; do not create a history entry for every keystroke.
- A failed publication keeps the previous live version intact. Unpublishing removes the article from public queries, navigation sections, product relations and sitemap; its revisions remain private.
- New articles begin as drafts. No seed/example post is published. Show Blog navigation and recent-article sections only when real published content exists.

## Roles and UI defaults

Confirmed: administrator-only publishing. Proposed implementation defaults: editors create and edit their own working drafts and upload media for those drafts; administrators manage all articles and maintain available categories/tags. Editors can assign existing taxonomy and published products. Recheck active account, role and ownership on every protected read and mutation; never rely on a hidden button as authorization.

Keep the main writing area spacious. Use a compact formatting toolbar, visible save status and distinct Preview/Publish controls. Tell editors that an administrator publishes their work. Separate publishing blockers (invalid content, inaccessible references, conflicting version, invalid slug) from SEO recommendations. A recommendation alone should not prevent publishing useful content.

## Media boundary

Use a storage interface with an ignored local development directory outside public/build output. Keep uploaded originals private; public optimized variants are readable only through an approved published use. Authenticated previews can access draft media. Existing approved bundled product images remain public as before.

A first-pass upload policy can allow JPEG, PNG and WebP with explicit byte/pixel limits, decoder validation, metadata stripping and generated keys. Exclude SVG, scripts, arbitrary embeds and remote image fetching. Cover/inline alt text is per usage. Rich media library management, replacement/crop/focal point controls and other product workflows remain M3C. Final production storage provider remains a release decision.

## Explicitly later in M3

- M3B: Zimbabwe-time scheduling, reliable server worker with authorization/idempotence/retries, revision browsing and restore UI.
- M3C: complete product editors and media library management.
- M3D: page sections, real-project approval workflow, enquiry management, redirects, users/roles and audit UI.
- M3A explicitly defers tables, FAQ blocks and code formatting. Add them in a later reviewed slice. M3B retains operational Zimbabwe-time scheduling, reliable worker retries/missed-job handling, and revision browsing/restore. M3A does persist immutable publication snapshots and protects them from draft edits, but does not provide user-facing revision history.

## Acceptance and review

1. An editor writes a draft and reloads without losing saved work; direct publish/unpublish attempts are denied.
2. An administrator previews the same rendering that will be public, fixes guidance issues and publishes a real article.
3. Anonymous HTML, metadata, schema, sitemap and product links expose the published version only.
4. Editing a live article leaves the public version unchanged until a subsequent administrator publication; conflicting saves fail visibly.
5. Unsafe content/uploads and anonymous draft/media access are rejected. Unpublishing removes public visibility without destroying history.
6. Strict types, lint, unit/database/security tests, production and development browser tests, desktop/mobile/accessibility checks and screenshots pass. Use disposable test accounts and keep credentials out of URLs and logs.

Update project records and provide a focused M3A PR with screenshots, test evidence and remaining M3 work. Preserve the local preview; do not deploy, merge existing PRs implicitly or change the old website.
