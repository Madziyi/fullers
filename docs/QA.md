# M1 review evidence

Tested locally against a production Next.js build, PostgreSQL and the bundled seed catalogue. No production deployment or old-site changes.

| Check                      | Evidence                                                                                                                                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict TypeScript          | `npm run typecheck` passed                                                                                                                                                                                                               |
| ESLint                     | `npm run lint` passed without warnings                                                                                                                                                                                                   |
| Unit/security/action tests | 17 passed: publication visibility, factual seed contract, WhatsApp formatting, settings validation, JSON-LD escaping, active-account/role checks, login throttle/failure handling, unauthorized mutations, atomic audit and revalidation |
| Migration / seed           | Applied to isolated PostgreSQL; repeated seed safely; seven public products, zero posts/projects                                                                                                                                         |
| Database integration       | Public draft/schedule exclusion, unique slug, publication date/approval constraints and transactional rollback passed                                                                                                                    |
| Production build           | Passed using Next.js Webpack; public pages server-rendered                                                                                                                                                                               |
| Browser regression         | 12 passed (52.1 seconds), no skipped tests; desktop 1440�1000 and mobile 390�664                                                                                                                                                         |
| Dependency audit           | Zero vulnerabilities after tooling/transitive updates                                                                                                                                                                                    |

Functional browser coverage: real administrator sign-in, audited SiteSettings save → public homepage update → restoration, sign-out protection; raw HTML content/approved claims; seven unique product routes/metadata; sitemap, robots, canonical output, no fabricated price/rating schema; server-side catalogue filtering; missing photo accessible names; mobile menu, correct WhatsApp URL, no horizontal overflow, admin noindex and credential callback CSRF enforcement.

Automated accessibility covers homepage, catalogue, missing-photo product detail and sign-in at desktop and mobile sizes. This supplements visual inspection, not a claim of full WCAG conformance. The first scan found contrast and accessible-name mismatches; corrected before final regression. Final axe scan: zero violations for the selected WCAG A/AA rules on all four routes at both viewport sizes. No field CWV measurements, full screen-reader audit, backup/restore test, external WhatsApp account validation or hosted CI result is claimed here.

## Screenshots

- [Desktop homepage](screenshots/home-desktop.png) and [first viewport](screenshots/home-desktop-hero.png)
- [Mobile homepage](screenshots/home-mobile.png) and [first viewport](screenshots/home-mobile-hero.png)
- [Desktop catalogue](screenshots/products-desktop.png) and [mobile catalogue](screenshots/products-mobile.png)
- [Desktop dashboard](screenshots/admin-desktop.png) and [mobile dashboard](screenshots/admin-mobile.png)
- [Desktop sign-in](screenshots/login-desktop.png) and [mobile sign-in](screenshots/login-mobile.png)

Screenshots are committed review artifacts. Playwright traces/reports are ignored locally and uploaded by CI on completion.
