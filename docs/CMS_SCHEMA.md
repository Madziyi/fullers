# CMS contract — M1 design

PostgreSQL is the source of truth. M1 implements authentication, catalogue reads and administrator SiteSettings edits. All other editors are M3 work, not imitation controls.

| Entity        | Lifecycle / relationships                                                                                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User / Role   | Active accounts with bcrypt hashes; ADMIN, EDITOR. JWT identifies account; every protected server request rechecks active status/role in DB. No public registration.                                                  |
| Post          | Stable unique slug, structured JSON document, summary, author, category, tags and product links. Draft → scheduled → published → archived. UTC publishAt/publishedAt; soft delete. SEO fields and optimistic version. |
| PostRevision  | Immutable JSON snapshot, actor and version; unique post/version. M3 rollback creates a new revision rather than deleting history.                                                                                     |
| Product       | Seven factual entries. Optional image; empty specifications mean unknown. Structured content, applications, related products, FAQ JSON, SEO and ordering.                                                             |
| Project       | Starts empty. Explicit approval and publication required. No client identities by default.                                                                                                                            |
| Media         | Storage key, MIME, bytes, dimensions, provenance, default alt, focal point. Per-usage product/post alt overrides. Upload validation and transformations land in M3.                                                   |
| PageContent   | Unique slug, controlled section JSON, version, lifecycle and SEO. No raw HTML.                                                                                                                                        |
| SiteSettings  | Singleton, contact/location, three editable statistic values/labels, award wording, social and site SEO defaults.                                                                                                     |
| Redirect      | Unique source path and destination; validate local destinations and prevent loops in M3 UI.                                                                                                                           |
| Inquiry       | Private personal information, consent timestamp, workflow status. M2 intake with validation and spam guard; retention policy pending.                                                                                 |
| AuditLog      | Actor, action, entity/id and bounded change JSON; settings updates audited atomically in M1. No passwords or enquiry bodies in logs.                                                                                  |
| LoginThrottle | Shared DB-backed account attempt window; no reliance on process-local counters.                                                                                                                                       |

Public selectors require PUBLISHED, publishedAt <= now and deletedAt = null. Scheduled records are never read as published: M3 worker must atomically promote them and invalidate caches. Preview will require authentication, no-store and noindex. JSON content requires an allowlisted renderer before public use in M3. PostgreSQL migrations contain checks for schedule/publication dates; unique slugs survive archival.

M3 publication transaction: authorize → validate content and links → check version → write revision + record + audit → commit → invalidate affected public paths. Scheduling requires an authenticated reliable worker/cron with idempotence and retries, not browser timers. Rich text SEO checks provide actionable advice, not ranking scores.

M1 uses request-time reads to avoid premature cache infrastructure. Explicit CONTENT_SOURCE=seed is available for local/demo review; it is read-only and never substitutes for database errors. Authentication and settings writes always require PostgreSQL. Future storage, password recovery, MFA, upload processing and scheduling remain release gates. Multi-instance edge/IP throttling should complement the database account throttle before exposure to the internet.
