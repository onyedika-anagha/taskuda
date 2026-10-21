# Taskuda — Security Review

**Track:** A
**Upstream:** [PRD](../pm/taskuda-prd.md) · [Design spec](../design/taskuda-design-spec.md) · [Implementation notes](../engineering/taskuda-impl-notes.md) (Definition of Done passed, waivers E1–E4)
**Scope:** all of Taskuda as on `main` at `6e65e20`: v1 (FR1–FR17), FR18–FR29 and FR30–FR34. This is the first security review; none was done for earlier cycles.
**Reviewed:** 2026-10-21
**Status:** Definition of Secure — passed with waivers S1–S3 (Section 10)

Everything below was re-checked against the code, the git history and the dependency tree, not taken from the implementation notes.

---

## 1. Attack Surface Summary

Taskuda has no database server and no accounts. The browser holds the data, and one serverless function exists for Jira.

| # | Entry point / data flow | Who can reach it | What it exposes or accepts | Controls (verified) |
|---|---|---|---|---|
| A1 | **`POST /api/jira`** (`api/jira.ts` → `server/jiraProxy.ts`) | Anyone on the internet who sets the right `Origin` header (a non-browser client can fake it) | Forwards a request to `<site>.atlassian.net` with the caller's own `Authorization: Basic` header; returns Jira's status and body | `ALLOWED_ORIGIN` exact match (fails closed with 500 when unset). Site must match `^[a-z0-9][a-z0-9-]{0,62}\.atlassian\.net$`. Only 4 GET and 1 POST path patterns, anchored, no `..`. `redirect: 'error'`, 10 s timeout. Body ≤ 10,000 chars (now also checked from `Content-Length` before reading). 60 requests/min per client IP per instance. Jira's headers (cookies included) are never passed back. Allowed requests are never logged; refusals now log one line without body or credentials. |
| A2 | **Static app** on Vercel | Public | HTML/JS/CSS, service worker, manifest | CSP in `vercel.json`: `script-src 'self'` + Google Identity script only, no `unsafe-inline`/`unsafe-eval` for scripts; `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`; `connect-src` limited to Google APIs, Gemini, OpenRouter and same origin. `nosniff`, `strict-origin-when-cross-origin`, `Permissions-Policy` blocks camera/mic/geo/payment. `style-src 'unsafe-inline'` is needed by Radix/Sonner inline styles (styles only). |
| A3 | **Google sign-in (GIS token flow)** | The user, via Google's consent screen | Short-lived access token | Scopes: `drive.appdata`, `calendar.events.owned`, `calendar.calendarlist.readonly` only (NFR7). The token lives in memory only; nothing writes it to IndexedDB or storage (`googleAuth.ts`). |
| A4 | **Drive backup and restore** | The user's own Google account | Full app data (tasks, companies, closeouts, activity log, settings, encrypted vault) | Hidden app-data folder, which other apps can't read. **Restore is an untrusted-input boundary** (a file can come from anywhere via Import): validated with Zod before anything is written. See finding F1. |
| A5 | **File import / export** (CR2) | The user picks a file | Same as A4 | Same validation as A4. |
| A6 | **Google Calendar sync** | Events in a calendar the user chose (including invitations from other people) | Event titles and times become tasks | Titles are rendered as React text (escaped). All-day events are skipped. Titles are capped at 200 chars. |
| A7 | **AI providers** (Gemini, OpenRouter) | Called from the browser with the user's own key | Day's task titles, statuses, companies, carryovers, reflection (disclosed before the first request, AC13.3) | Key sent in a header (`x-goog-api-key` / `Authorization: Bearer`), never in a URL. Responses parsed as JSON and rendered as text. |
| A8 | **Secrets vault** (AI key, Jira token) | Code running on Taskuda's origin | Encrypted secrets | AES-256-GCM with context-bound additional data and random IVs; PBKDF2-SHA256 at 600,000 iterations; non-extractable device key that never leaves the device or enters backups. The passphrase-derived key wraps the data key for new devices. |
| A9 | **Service worker** | Same origin | Cached app shell | Precache only; no runtime caching of API responses; `/api/` is excluded from the navigation fallback. `sw.js` is served `no-cache`. |
| A10 | **localStorage** (new in FR33–FR34) | Same origin | `taskuda.welcomeDone`, `taskuda.setupStep`, `taskuda.introSeen`, and dismissed-prompt flags | Booleans and step names only. Unknown values are ignored (`getSetupStep`). Changing them only changes what this device shows; no data or access depends on them. |
| A11 | **FR30–FR32 due dates and at-risk markers** | Local | `dueDate`/`dueTime` on tasks, risk computed from them | No network path. The only exposure is via restore (A4), covered by F1. |

**Missed by the Engineering stage:** nothing new on the network side. The implementation notes list every endpoint. The restore validation gap (F1) and the missing refusal logging (F3) were not called out there.

## 2. Dependency & Vulnerability Scan

Run on 2026-10-21 with the lockfile on `main`:

- `npm audit --omit=dev`: **0 vulnerabilities.**
- `npm audit` (including dev dependencies): 7 high, all the same advisory (`braces`, GHSA-vfj7-8cjw-p6xm). The path is `shadcn@4.22.0 → fast-glob → micromatch → braces@3.0.3`. It's a CLI used only when adding UI components, never shipped or run in CI. **Accepted under the existing waiver E3** (implementation notes Section 7); no new reason to revisit.
- **No dependencies were added or changed in FR30–FR34** (`package.json` unchanged since 0.2.0).

## 3. Secrets & Credential Audit (independent)

- **Tracked files:** `git grep` for Google API keys (`AIza…`), OpenRouter keys (`sk-or-v1-…`), generic `sk-` keys, Atlassian tokens (`ATATT…`), GitHub tokens, AWS keys, Slack tokens and private-key blocks: **no matches.**
- **Full history:** the same patterns across `git log --all -p`: **0 matches.** No `.env` file was ever committed; only `.env.example` (empty values) exists. `.gitignore` excludes `.env` and `.env.*`.
- **Configured values:** `VITE_GOOGLE_CLIENT_ID` is a public OAuth client ID by design (no client secret is used anywhere). `ALLOWED_ORIGIN` is not a secret.
- **Least privilege:** Google scopes are the narrowest that work (A3). The Jira token and AI key are the user's own, used only for their own provider. Taskuda holds no service credentials, IAM roles or API keys of its own.

## 4. AuthN / AuthZ Review

| Path | Check | Result |
|---|---|---|
| `POST /api/jira` | Origin allow-list, path allow-list, Basic credentials required, rate limit | **Verified** by `server/jiraProxy.test.ts` (16 tests). Origin is a browser-level control only, so the proxy is effectively reachable by scripts too. The worst case is relaying requests to the 5 allowed Jira endpoints with the caller's own credentials. See waiver S2. |
| Google APIs | Google's own OAuth; the app only asks for A3's scopes | Verified in `googleAuth.ts`, `driveAppData.ts`, `calendarApi.ts`. |
| AI providers | User's own key | Verified (A7). |
| Local data (IndexedDB, localStorage) | Same-origin policy | No other access path exists. |
| Multi-tenant isolation | **N/A.** Single user per browser profile, no shared server data (PRD Out of Scope 6–7). | — |

## 5. Data Classification & Handling

- **Personal data:** task titles and notes, company/client names, daily reflections and ratings, Jira email and site, Google account (via consent only). Work content may be confidential to the user's employers.
- **At rest:** in the browser's IndexedDB, protected by the OS user account and browser profile. Secrets are additionally encrypted (A8). The Drive backup is JSON in the user's own Drive app-data folder: **task content is not encrypted there, secrets are.** This matches the PRD (Drive as the user's own storage). The README privacy section said only "an encrypted-keys backup", which read as if everything was encrypted; it now says plainly that task content isn't.
- **In transit:** HTTPS to every endpoint (Vercel, Google, Atlassian, Gemini, OpenRouter).
- **Shared with third parties:** AI providers receive the day's task data only after the user confirms the disclosure (AC13.3). Jira receives issue reads and status changes. Taskuda's own server sees Jira requests in transit and stores nothing.
- **Payment data / PCI DSS:** **none.** Taskuda has no billing (PRD Out of Scope 8), so there is no PCI scope.

## 6. Infrastructure & Config Review

The historical incidents in this workspace (unverified Search Console ownership, a leaked IAM key, an under-restricted CDN origin) were checked one by one.

| Item | Status |
|---|---|
| CDN / origin | Vercel serves the static build. There is no separate CDN, storage bucket or origin to restrict. The repo's `vercel.json` sets the headers in A2. |
| IAM keys | **None exist.** Taskuda uses no cloud credentials of its own. |
| CI/CD secrets | No CI workflow is checked in, and the only server environment variable (`ALLOWED_ORIGIN`) is not secret. |
| New ports / admin panels | None. |
| Subdomain DNS, Search Console ownership, Google OAuth client origins, Vercel environment | **Not verifiable from the repository.** See waiver S1 and the owner checklist below. |

**Owner checklist (needed to close S1):**
1. Vercel: `ALLOWED_ORIGIN` is set to the exact production origin (for example `https://taskuda.<your-domain>`) for Production, and only the intended Git branch deploys there.
2. Google Cloud OAuth client: **Authorized JavaScript origins** list only the production origin and `http://localhost:5173` (dev). There are no redirect URIs, since the token flow doesn't use them. The consent screen is in **Testing** with only known test users.
3. DNS: the Taskuda subdomain's CNAME points at Vercel and at nothing else. If the Vercel project is ever deleted, remove the record (PRD RK10).
4. Search Console (when the app goes public): the domain verification TXT record belongs to your account, and you'd notice another owner being added.
5. GitHub, Vercel, Google Cloud and the registrar accounts use two-factor authentication.

## 7. Logging & Monitoring

- **Proxy refusals (fixed in this review, F3):** a refused request (bad origin, rate limit, missing credentials, oversized or invalid body, disallowed target) now writes one `console.warn` line, `[jira-proxy] refused <status>: <reason>`, which shows in Vercel's function logs. It never includes the body, the target site or the `Authorization` header (NFR4; tested). Allowed requests are still not logged.
- **Client-side security events** (wrong passphrase, rejected AI key or Jira token, Google consent denied) are shown to the user, who is the only party affected. There is no server to send them to, by design.
- **Suggested alert, not wired up:** a Vercel log alert on more than ~100 `[jira-proxy] refused` lines per hour would show proxy abuse (see S2).

## 8. Incident Response Notes

| If this is compromised | Do this |
|---|---|
| A user's AI key | Revoke it at Google AI Studio / OpenRouter, then Settings → AI & Security → API key → Remove (or Reset secrets). Set a provider spending limit (the app already recommends this). |
| A user's Jira API token | Revoke it at id.atlassian.com → Security → API tokens; then Settings → Integrations → Jira → reconnect with a new token. |
| The passphrase | Settings → AI & Security → Change passphrase. The data key is re-wrapped and the next backup carries the new wrapping. |
| The Google account | Revoke Taskuda at myaccount.google.com → Security → Third-party access. Backups in the app-data folder go with the account. |
| The Vercel or GitHub account | Rotate the account credentials and turn on two-factor auth. Check recent deployments and the CSP in `vercel.json` for tampering, then redeploy from a known-good commit. |
| The proxy is being abused | Confirm through the refusal logs, then lower `RATE_LIMIT`, add Vercel Firewall rules, or remove `ALLOWED_ORIGIN` to turn the proxy off (it fails closed). |

## 9. Findings

| ID | Severity | Finding | Status |
|---|---|---|---|
| **F1** | Medium (availability) | **Restore and import accepted malformed dates and times.** `dayKey`, `startTime`, `dueDate`, `dueTime` and the series' dates were `z.string()`. A crafted or corrupted file with, say, `dueDate: "not-a-date"` was restored, and `fromDayKey` then threw while rendering Today, so Today crashed on every open until site data was cleared. Reproduced with a probe test before fixing. | **Fixed.** `schemas/backupFile.ts` validates every date with `isValidDayKey` and every time with `isValidTime`, and `dueMoment` returns `null` instead of throwing on bad values. Tests: `backupSnapshot.test.ts` ("rejects malformed dates and times…"), `dueDates.test.ts`. |
| **F2** | Low | **Vault iteration count came from the file unbounded.** A crafted backup could set `kdf.iterations` to 1 (weak) or a huge number (unlock hangs). It only affects a vault from that same file. | **Fixed.** Bounded to 100,000–10,000,000. Test: "rejects a vault with an unsafe PBKDF2 iteration count". |
| **F3** | Low | **The proxy logged nothing at all**, so abuse would be invisible; and it read the whole body before checking its size. | **Fixed.** Refusals log one line without secrets, and a declared oversized `Content-Length` is refused before reading. Tests in `server/jiraProxy.test.ts`. |
| F4 | Low | The proxy's `Origin` check stops browsers, not scripts, so it can relay calls to the 5 allowed Jira endpoints using the caller's own Jira credentials. The rate limit is per instance. | **Waived (S2).** |
| F5 | Informational | **Calendar invitations are untrusted text.** Anyone who can add an event to the chosen calendar puts its title into tasks, reports (copied by the user into Slack, Teams, Jira or email) and the AI prompt. Rendering is escaped, and AI output is only displayed, so the impact is limited to misleading text the user can see before copying. | Accepted; no change. |
| F6 | Informational | **Atlassian advises against collecting API tokens** (PRD RK17). | Already tracked: Jira must move to OAuth 2.0 (3LO) or be flagged off before a public launch. Recorded as S3. |

## 10. Definition of Secure

- [x] Attack surface summary is complete: every endpoint, data flow and integration is in Section 1.
- [x] No unresolved critical/high dependency vulnerabilities. Production has 0; the dev-only `braces` chain is under waiver E3.
- [x] Independent secrets search (tracked files and full history) found nothing hardcoded; credentials follow least privilege.
- [x] Every endpoint and data-access path has a verified auth/authz check (Section 4), with the proxy's limits waived in S2.
- [x] Multi-tenant isolation: not applicable (single user, no shared server data).
- [x] PII and payment data handling is stated (Section 5). No PCI scope.
- [ ] New infra (subdomain, DNS, Search Console, OAuth client, Vercel environment) checked against the incident list. **Waived (S1)**: not verifiable from the repository.
- [x] Security-relevant events are logged somewhere reviewable (Section 7).
- [x] File committed at `docs/security/taskuda-security-review.md`.

### Waiver S1: infrastructure not verified
Reason: the Vercel project, DNS records, Google OAuth client and Search Console can't be seen from the repository, and this review had no access to those consoles.
Owner: umpiremed@gmail.com
Revisit by: before adding test users beyond the owner, or before any public launch, by working through the owner checklist in Section 6.
Exposure restriction while open: Google OAuth stays in **Testing** mode with only known test users (PRD assumption, RK5), and the app isn't promoted anywhere (Growth stage must not start a public launch).

### Waiver S2: Jira proxy reachable by scripts
Reason: an Origin check can't authenticate non-browser callers, and Taskuda has no accounts to authenticate against. The relay is limited to 5 Jira endpoints and the caller's own credentials, rate limited, and now logged on refusal.
Owner: umpiremed@gmail.com
Revisit by: public launch, together with S3 (moving Jira to OAuth 3LO removes the proxy's token handling).
Exposure restriction while open: none beyond the controls in A1; accepted risk for personal use. If the refusal logs show abuse, turn the proxy off by unsetting `ALLOWED_ORIGIN`.

### Waiver S3: Jira API tokens (PRD RK17)
Reason: Atlassian's guidance recommends OAuth 2.0 (3LO) or Forge for apps that handle Jira access.
Owner: umpiremed@gmail.com
Revisit by: public launch.
Exposure restriction while open: the Jira integration must be flagged off, or moved to OAuth 3LO, before Taskuda is offered to anyone outside the owner's test users.

## 11. Downstream notes for the Growth Manager stage

- **Don't** run a public launch or announce Taskuda while S1 and S3 are open. Personal use and named test users only.
- Claims that are true and documented: "your data stays in your browser and your own Google Drive"; "AI and Jira keys are encrypted with AES-256-GCM"; "no Taskuda server stores your tasks".
- Claims to avoid: "end-to-end encrypted" (Drive backups hold task content unencrypted), and "secure Jira integration" without noting the API-token limitation.
- Taskuda has no referral, sharing or public-content mechanics, so there is no growth-abuse surface yet.
