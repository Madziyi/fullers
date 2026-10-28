# Current work

October 27: user authorized Supabase configuration and reuse of caption-assist. Private fullers schema, restricted database login, seven approved products and private media bucket are configured. Prisma/TLS and production/browser CMS checks passed. See docs/SUPABASE_STAGING.md. The user supplied the key in ignored .env.supabase-staging; real private Storage upload/read/delete, byte preservation, public denial and both desktop/mobile CMS workflows passed. Initial admin is provisioned and production login verified; scheduler and deployment remain pending; original .env and user preview are preserved.

M3 custom CMS completion is implemented on `codex/m3-cms-completion`, stacked on `feat/m3b-publishing-reliability` (PR #4). The user authorized the remaining M3 slices and a final admin/CMS UI cleanup on October 25, 2026. No deployment, merge or old-site change is authorized or performed.

Delivered M3C/M3D: administrator product CRUD with structured specifications/FAQs, related products, SEO, private preview and explicit publication; media upload/library with provenance, alt text, focal preview and safe replacement; controlled page sections and private previews; real-project approval/publication, product/photo associations and public pages; enquiry statuses; safe redirect CRUD and legacy URL resolution; user/role controls and audit browsing. Conflicting saves fail visibly. Page/project saves return published entries to private draft; the UI states this behavior. Home/About/Services preserve original approved content and render published supplemental sections.

Articles now also support bounded tables, FAQs and code, block reordering, canonical/social fields, taxonomy browsing and explicit article link suggestions. Existing autosave, immutable publication snapshots and exact-version scheduling remain. Revision restore/history UI remains explicitly excluded by the user.

The content studio has active navigation, current publishing counts, recent articles, attention links, consistent forms/tables and responsive layouts. Product/media/page/project administration is administrator-only; editors retain their own article drafting workflow. Enquiries remain private and administrator-only; no notification provider or delivery is claimed.

Verification and screenshots: docs/M3_COMPLETION_QA.md. Production QA uses ignored `.next-m3-final` on port 3127; development login QA uses `.next-review` on port 3119. The user preview at port 3107 is preserved. Keep generated-only next-env.d.ts changes out of commits.

M1/M2/M3A review gates were complete; prior review PRs remain separate: #1 foundation, #2 public pages, #3 articles, #4 scheduled publishing. Do not merge them implicitly.

M4 release inputs remain: hosting/storage and dependable scheduler configuration (including PUBLISH_WORKER_SECRET); notification provider if desired; approved privacy/retention text; original photo rights and missing product photos; verified product specifications, service regions and award details; original WhatsApp-link verification; staging, backup/restore exercise, monitoring, CWV and final UAT. No production scheduler is configured, so scheduled jobs require the protected worker to be invoked by a dependable trigger before release.

Review packaging: the user explicitly approved public source export on October 26, 2026. The branch is pushed and [PR #5](https://github.com/Madziyi/fullers/pull/5) is open, stacked on M3B. Hosted CI is pending; no merge or deployment was performed.

Manual hosting handoff requested: docs/STAGING_RELEASE.md. Staging indexing controls implemented/verified. User requested instructions for both Hostinger and Vercel; no deployment performed. Original 5 MiB uploads retained, so Vercel still needs a payload-limit adaptation.
