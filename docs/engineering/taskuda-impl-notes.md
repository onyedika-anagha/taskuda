# Taskuda — Implementation Notes

**Track:** A
**Upstream:** [PRD](../pm/taskuda-prd.md) (DoR passed, waiver W1) · [Design spec](../design/taskuda-design-spec.md) (DoR passed)
**Branch:** `feature/taskuda-v1`
**Status:** Definition of Done — passed with waivers E1–E4 (Section 7)
**Last updated:** 2026-10-20

This document is written for the Security Engineer stage: every endpoint, data flow, credential and dependency is listed here so the review doesn't need archaeology.

---

## 1. Technical Design Summary

### 1.1 Architecture

A static React PWA plus one serverless function. There is no Taskuda database or user account.

```
Browser (PWA, offline-capable)
├── IndexedDB (Dexie)            tasks, companies, closeouts, activity log, settings,
│                                calendar mappings, encrypted vault, device key
├── Google Identity Services     access tokens in memory only
│   ├── Drive v3 (appDataFolder) backups
│   └── Calendar v3              two-way sync
├── Gemini / OpenRouter          AI recommendations, user's own key
└── /api/jira (same origin) ──►  Vercel function ──► <site>.atlassian.net
```

Layers (workspace code-separation rule): `pages/` compose components; `components/` are UI only; `hooks/` connect UI to `stores/` (Zustand, UI state) and `services/` (data and integrations); `utils/` are pure; `schemas/` validate forms and untrusted files.

### 1.2 Data model (IndexedDB `taskuda`)

| Table | Key | Backed up | Contents |
|---|---|---|---|
| `tasks` | `id` | Yes | Task (title, notes, companyId, dayKey, block, order, startTime, duration, status, carryover links, source, jiraIssue) |
| `companies` | `id` | Yes | name, colorId |
| `closeouts` | `dayKey` | Yes | started/finished/report-copied times, rating, reflection, outcomes |
| `activityLog` | `++id` | Yes | created / updated / status / moved / carried / deleted events (metric M1) |
| `settings` | `key` | Yes, except `device.*`, `drive.*`, `google.*` | app settings, closeout drafts, AI provider/model, Jira site + status map |
| `calendarMappings` | `taskId` (`&eventId`) | Yes | task↔event links, sync times, tombstones |
| `vault` | `'vault'` | Yes | PBKDF2 params, passphrase-wrapped data key, key check, encrypted secrets |
| `deviceKeys` | `'device'` | **Never** | non-extractable AES key + device-wrapped data key |

Schema versions: **v1** (first six tables) and **v2** (adds `vault`, `deviceKeys`). Both are additive.

**Migration reversibility:** IndexedDB/Dexie can't be downgraded in place; a lower version number throws `VersionError`. Rollback path: export a backup file (Settings → Backup), deploy the older build, clear site data, then import. The backup format is versioned (`version: 1`) and validated with Zod.

### 1.3 Endpoints and external calls (every network path)

| From | To | Auth | Purpose |
|---|---|---|---|
| Browser | `accounts.google.com/gsi/client` | — | Load Google Identity Services script |
| Browser | `www.googleapis.com/drive/v3/files`, `/upload/drive/v3/files` (spaces=appDataFolder) | Bearer (Google token, memory only) | List / create / download / delete backups |
| Browser | `www.googleapis.com/calendar/v3/users/me/calendarList`, `/calendars/{id}/events` | Bearer | Calendar list; events list (sync token), insert, patch, delete |
| Browser | `generativelanguage.googleapis.com/v1beta/models/{model}[:generateContent]` | `x-goog-api-key` header | Test key; recommendations |
| Browser | `openrouter.ai/api/v1/key`, `/chat/completions` | `Authorization: Bearer` | Test key; recommendations |
| Browser | `POST /api/jira` (same origin) | `Authorization: Basic` (user's email:token) | Jira proxy |
| `api/jira.ts` | `https://<site>.atlassian.net` — only: `GET /rest/api/3/myself`, `GET /rest/api/3/status`, `GET /rest/api/3/issue/{KEY}?fields=summary,status`, `GET`/`POST /rest/api/3/issue/{KEY}/transitions` | Forwarded Basic header | Test connection, statuses, issue lookup, transitions |

**New server endpoint:** `POST /api/jira` (`api/jira.ts` → `server/jiraProxy.ts`). It is intentionally unauthenticated by Taskuda (the user's own Jira credentials travel in the request). Restrictions:
- `Origin` must equal `ALLOWED_ORIGIN`.
- The site must match `^[a-z0-9][a-z0-9-]{0,62}\.atlassian\.net$`.
- The method and path must be on the allow-list, with no `..`.
- The body is capped at 10 KB, redirects are refused, and upstream calls time out after 10 s.
- There's a per-client rate limit of 60 requests a minute, held in memory per instance.
- Only the status and body come back; Jira's headers are dropped.
- Nothing is logged.

### 1.4 Credentials and secrets

| Secret | Where | Protection |
|---|---|---|
| Gemini / OpenRouter key, Jira email+token | `vault.secrets` | AES-256-GCM with a random data key; AAD = secret name. The data key is wrapped by PBKDF2-SHA256 (600k, random salt) from the passphrase, and separately by a non-extractable device key. A key-check value rejects stale device keys. |
| Passphrase | Never stored | — |
| Google access token | Memory only | ~1 h lifetime; silent renewal with `prompt: 'none'`, else "Reconnect Google" |
| Google client ID | `VITE_GOOGLE_CLIENT_ID` or setting `google.clientId` | Public identifier, not a secret |
| `ALLOWED_ORIGIN` | Vercel env | Not secret |

### 1.5 Mapping to requirements

Every PRD requirement maps to the screens in the design spec's traceability map. In code:

| Area | PRD | Main code |
|---|---|---|
| Canvas, tasks, companies, drag-and-drop | FR1–FR5, FR6 | `pages/TodayPage`, `components/canvas/*`, `components/task/*`, `services/db/*`, `hooks/useCanvasDragAndDrop` |
| Offline / PWA | FR6, FR16, NFR1–NFR3 | `vite.config.ts` (Workbox), `services/pwa/serviceWorker.ts`, `stores/installStore.ts` |
| Drive backup / restore | FR7 | `services/google/*`, `services/backup/*`, `stores/backupStore.ts`, `components/backup/*` |
| Calendar | FR8 | `services/calendar/*`, `services/google/calendarApi.ts`, `stores/calendarStore.ts` |
| Voice | FR9 | `services/voice/*`, `services/reminders/reminderPlan.ts`, `hooks/useReminderTicks.ts` |
| Closeout, carryover | FR10, FR11 | `services/closeout/closeoutService.ts`, `stores/closeoutStore.ts`, `components/closeout/*` |
| Secrets | FR12, NFR5 | `services/crypto/*`, `stores/vaultStore.ts`, `components/security/*` |
| AI | FR13 | `services/ai/*`, `stores/recommendationsStore.ts` |
| Report | FR14 | `utils/reportBuilder.ts`, `utils/reportFormatters.ts`, `components/report/*` |
| Jira | FR15, NFR6 | `server/jiraProxy.ts`, `api/jira.ts`, `services/jira/*` |
| Stats | FR17 | `utils/metrics.ts`, `hooks/useMetrics.ts` |

### 1.6 Decisions made during build

These are recorded in the design spec where they change it.
- **Design-spec engineering notes, resolved:**
  - Default AI models: `gemini-3.5-flash-lite` and `openrouter/auto`.
  - Calendar conflicts: the later edit wins.
  - Backup versions kept: 10.
  - "Close out again" replaces the day's closeout and keeps the first timing for M3.
- **Calendar uses narrower scopes than planned:** `calendar.events.owned` instead of `calendar.events`.
- **Drag starts from a handle** on all devices, instead of a long-press on the note.
- **Done notes are desaturated** instead of faded with opacity, which would break contrast.
- **Next and Save buttons stay enabled** and explain what's missing, instead of being greyed out.
- **Toasts appear at the top,** so they don't cover the phone's bottom bar.
- **Past days that were never closed out can still be closed out.**
- **Voice lines say "2:00 PM".**
- **First-run Drive connect** checks for an existing backup before uploading a new one.
- **Performance (NFR3):**
  - Settings, Report, Welcome and the closeout dialog load on demand.
  - Libraries are split into `react`, `ui` and `data` chunks.
  - First load is about 270 KB gzip of JavaScript; the app's own chunk is 46 KB.
- **Focus outline:** a solid 2px outline is used everywhere, with contrast between 6.9:1 and 9.4:1.

---

## 2. Test Plan & Coverage

- **Totals:** 52 unit/component test files and 13 Playwright specs.
  - Final run (2026-10-20): 383 unit/component tests and 92 Playwright tests passing across desktop, tablet and phone sizes, with 4 skipped as screen-size specific.
- **External services** are replaced by faithful fakes:
  - Google Identity Services, Drive and Calendar, including sync tokens and 410 handling (`src/test/fakeGoogle.ts`, `fakeDrive.ts`, `fakeCalendar.ts`, `e2e/fakeGoogle.ts`)
  - AI providers (`mockFetch`)
  - Jira, behind the proxy (`fakeJira.ts`)
  - Web Speech (`fakeSpeech.ts`)
- **Accessibility:** axe (WCAG 2.1 A/AA) runs on every screen and every settings section, at three sizes, in light and dark (`e2e/a11y.spec.ts`).

### 2.1 Acceptance criteria → tests

Paths are under `src/` unless they start with `e2e/` or `server/`.

| ID | Tests |
|---|---|
| AC1.1, AC1.3 | `pages/TodayPage.test.tsx`, `e2e/tasks.spec.ts` |
| AC1.2 | `pages/TodayPage.test.tsx` |
| AC2.1 | `components/task/TaskEditorForm.test.tsx`, `services/db/taskRepository.test.ts` |
| AC2.2, AC2.3 | `pages/TodayPage.test.tsx`, `services/db/taskRepository.test.ts`, `e2e/tasks.spec.ts` |
| AC3.1 | `services/db/taskRepository.test.ts`, `e2e/tasks.spec.ts` (mouse drag) |
| AC3.2 | `pages/TodayPage.test.tsx`, `e2e/tasks.spec.ts` (keyboard drag, menu) |
| AC4.1 | `utils/taskStatus.test.ts`, `pages/TodayPage.test.tsx`, `e2e/tasks.spec.ts` |
| AC4.2 | `components/task/StatusToggle.test.tsx` |
| AC4.3 | `services/db/taskRepository.test.ts`, `e2e/tasks.spec.ts` |
| AC5.1 | `components/settings/CompaniesSection.test.tsx`, `services/db/companyRepository.test.ts`, `e2e/tasks.spec.ts` |
| AC5.2 | `components/task/StickyNote.test.tsx`, `e2e/tasks.spec.ts` |
| AC5.3 | `components/settings/CompaniesSection.test.tsx`, `services/db/companyRepository.test.ts` |
| AC6.1, AC6.2 | `e2e/offline.spec.ts` |
| AC7.1 | `services/backup/driveBackup.test.ts`, `stores/backupStore.test.ts`, `e2e/backup.spec.ts` |
| AC7.2 | `e2e/backup.spec.ts` (restore in a second browser context) |
| AC7.3 | `services/google/googleAuth.test.ts` |
| AC7.4 | `components/settings/BackupSection.test.tsx`, `e2e/backup.spec.ts` |
| AC8.1, AC8.3 | `services/calendar/calendarSync.test.ts`, `e2e/calendar.spec.ts` |
| AC8.2, AC8.4, AC8.5 | `services/calendar/calendarSync.test.ts` |
| AC9.1 | `hooks/useReminderTicks.test.tsx` |
| AC9.2, AC9.3 | `hooks/useReminderTicks.test.tsx`, `components/settings/VoiceSection.test.tsx` |
| AC9.4 | `components/settings/VoiceSection.test.tsx` |
| AC9.5 | `hooks/useReminderTicks.test.tsx`, `services/reminders/reminderPlan.test.ts` |
| AC10.1 | `components/closeout/CloseoutDialog.test.tsx`, `services/closeout/closeoutService.test.ts`, `utils/closeoutRules.test.ts` |
| AC10.2 | `components/closeout/CloseoutDialog.test.tsx`, `services/closeout/closeoutService.test.ts` |
| AC10.3 | `services/closeout/closeoutService.test.ts` |
| AC11.1, AC11.2 | `services/db/taskRepository.test.ts`, `services/closeout/closeoutService.test.ts`, `components/task/StickyNote.test.tsx` |
| AC12.1 | `components/settings/AiProviderPanel.test.tsx` |
| AC12.2 | `components/security/SecretField.test.tsx` (first test: masked last 4, input cleared) |
| AC12.3 | `services/crypto/secretVault.test.ts`, `services/backup/backupSnapshot.test.ts`, `e2e/secrets.spec.ts` (real IndexedDB dump) |
| AC12.4 | `services/crypto/secretVault.test.ts`, `e2e/secrets.spec.ts` |
| AC12.5 | `services/crypto/secretVault.test.ts`, `components/security/SecretField.test.tsx` |
| AC12.6 | `services/ai/clients.test.ts`, `e2e/secrets.spec.ts` (watches every request) |
| AC13.1–AC13.3 | `components/closeout/RecommendationsStep.test.tsx`; data minimization in `services/ai/buildRecommendationPrompt.test.ts` |
| AC14.1 | `components/report/ReportBuilder.test.tsx`, `utils/reportFormatters.test.ts` |
| AC14.2 | `utils/reportFormatters.test.ts` (exact text per format), `components/report/ReportBuilder.test.tsx`, `e2e/report.spec.ts` (real clipboard) |
| AC14.3 | `components/report/ReportBuilder.test.tsx`, `e2e/report.spec.ts` |
| AC14.4 | `utils/reportFormatters.test.ts` (`buildReport` group) |
| AC15.1 | `services/jira/jiraService.test.ts`, `components/settings/JiraCard.test.tsx`, `e2e/jira.spec.ts` |
| AC15.2 | `services/jira/jiraService.test.ts`, `components/settings/JiraCard.test.tsx` |
| AC15.3 | `services/jira/jiraService.test.ts`, `components/settings/JiraCard.test.tsx`, `e2e/jira.spec.ts` |
| AC15.4 / NFR6 | `server/jiraProxy.test.ts` (15 rule tests) |
| AC16.1 | `components/layout/InstallPrompt.test.tsx` |
| AC16.2 | `components/layout/UpdatePrompt.test.tsx` |
| AC17.1 | `components/settings/StatsSection.test.tsx`, `utils/metrics.test.ts` |
| CR1 | `services/google/googleAuth.test.ts`, `components/settings/CalendarCard.test.tsx` |
| CR2 | `components/settings/BackupSection.test.tsx`, `e2e/backup.spec.ts` |
| NFR1 | `e2e/offline.spec.ts` |
| NFR2 | `e2e/offline.spec.ts` (AC6.2) |
| NFR3 | `e2e/performance.spec.ts` (repeat load < 2 s; drop with 50 notes < 100 ms) |
| NFR4 / NFR5 | `services/crypto/secretVault.test.ts`, `e2e/secrets.spec.ts`, `server/jiraProxy.test.ts` (no logging) |
| NFR7 | `services/google/googleAuth.test.ts` (Drive scope), `components/settings/CalendarCard.test.tsx` (Calendar scopes) |
| NFR8 | `e2e/a11y.spec.ts`, keyboard tests in `e2e/tasks.spec.ts` |
| NFR9 | `components/settings/VoiceSection.test.tsx` (unsupported browser) |
| NFR10 | Manual: Vercel Hobby, no paid services (Section 7, waiver E2) |
| DAC1 | `components/task/TaskEditorForm.test.tsx`, `pages/TodayPage.test.tsx`, `e2e/tasks.spec.ts` |
| DAC2 | `components/task/StatusToggle.test.tsx` |
| DAC3 | `e2e/performance.spec.ts` |
| DAC4 | `components/closeout/CloseoutDialog.test.tsx` (counts 8 interactions), `e2e/closeout.spec.ts` |
| DAC5 | `components/report/ReportBuilder.test.tsx` |
| DAC6 | `components/task/TaskEditorForm.test.tsx` |
| DAC7 | Manual copy review against design spec Section 8 (self-review, Section 4) |
| DAC8, DAC10 | `e2e/a11y.spec.ts` (every screen, 3 sizes, light + dark) |
| DAC9 | `e2e/a11y.spec.ts` (Tab order), `e2e/tasks.spec.ts` (keyboard reorder) |
| DAC11 | `utils/companyPalette.test.ts` |
| DAC12 | `hooks/useReminderTicks.test.tsx`, `components/settings/VoiceSection.test.tsx`, `e2e/voice.spec.ts` |
| DAC13 | `components/closeout/CloseoutDialog.test.tsx`, `e2e/closeout.spec.ts` (survives reload) |
| DAC14 | `components/security/SecretField.test.tsx` |

---

## 3. Implementation

- Code follows the patterns already in the repo:
  - shadcn/ui primitives for standard controls
  - native radios for segmented controls, so arrow keys and screen readers work
  - React Hook Form + Zod for forms
  - live queries for data reads
  - repositories that write each change and its activity event in one transaction
- **No unresolved `TODO`/`FIXME`/`HACK`.** A search of tracked source files finds none.
- **No dead exploratory code.** Temporary screenshot scripts were deleted after use.
- **Bugs caught by tests and fixed during build:**
  - The vault accepted stale device keys (fixed with a key-check value).
  - Dexie replaced my `NotFoundError` with its own error of the same name.
  - A drop on a phone tab didn't register, and keyboard drops landed on the column instead of the note.
  - Drag announcements were wrong or overwritten.
  - Toasts covered the phone action bar.
  - Several contrast failures: muted text, the red Delete text in both themes, and the focus ring.
  - A form inside a dialog submitted the task editor through the React portal.

---

## 4. Self-Review Pass

The diff was re-read stage by stage. Checks against the Definition of Done (Section 6):
- **Error copy (DAC7):** every user-facing error offers a next step: Try again, Skip, Open Settings, Reconnect, Restore without keys, or manual copy.
- **No technical leakage (user-relevance rule):** nothing displays raw IDs, enum values or ISO timestamps.
  - Dates and times go through date-fns formatting.
  - Statuses use labels.
  - Companies show names.
  - Device names are human-readable.
  - Jira status names are the site's own names.
- **Keyboard and focus:** every action has a keyboard path, and overlays trap and return focus (Radix). Focus is always visible.
- **Logging:** there are no `console.log` calls in `src/` or `server/`.

---

## 5. Documentation Updates

- `README.md`: setup, environment variables, Google Cloud setup, Vercel deploy, structure, privacy summary.
- `CHANGELOG.md`: 0.1.0.
- Design spec: build decisions marked "changed during build" or "Decided".
- PRD: risk RK11 added (Atlassian guidance on API tokens).
- Task list: all tasks checked.

---

## 6. Definition of Done

- [x] Every acceptance criterion from the PRD and design spec is implemented and has a passing test (Section 2.1). Exceptions are manual checks: DAC7 (copy review) and NFR10 (cost), see waiver E2.
- [x] The full test suite passes (unit/component and Playwright at three sizes).
- [x] Lint, typecheck and build pass clean, with no warnings.
- [x] No hardcoded secrets or credentials. A search for API key, token and private-key patterns and secret-like assignments across tracked files found nothing; only `.env.example` is committed.
- [x] Every new endpoint or data-access path has an explicit auth/authz check, or a note why it's intentionally open:
  - `POST /api/jira` is open by design: it carries the user's own Jira credentials, and is restricted by origin, allow-list and rate limit (Section 1.3).
  - Google and AI calls use the user's own tokens and keys.
  - There are no other server endpoints.
- [x] Schema migrations are reversible, or there's a documented reason they aren't (Section 1.2).
- [x] No unresolved `TODO`/`FIXME`.
- [x] Implementation notes are committed at `docs/engineering/taskuda-impl-notes.md`.
- [x] README and CHANGELOG reflect the change.

### Dependencies added this cycle (for the Security stage)

- **Runtime:**
  - React and routing: react 19, react-dom, react-router 8
  - UI: radix-ui, @dnd-kit/{core,sortable,utilities}, sonner, lucide-react, next-themes, class-variance-authority, cn, tw-animate-css, @fontsource-variable/geist
  - Forms: react-hook-form, @hookform/resolvers
  - Data: zustand, dexie, dexie-react-hooks, zod 3, date-fns 4
- **Dev:**
  - Build: vite 8, @vitejs/plugin-react, vite-plugin-pwa, tailwindcss and @tailwindcss/vite, typescript 6, @types/*
  - Tests: vitest 5, jsdom, fake-indexeddb, @testing-library/*, @playwright/test, @axe-core/playwright
  - Tooling: oxlint, prettier, shadcn (CLI)
- **`npm audit --omit=dev`:** 0 vulnerabilities.
- **`npm audit` including dev dependencies:** 7 high, all one advisory (`braces`, GHSA-vfj7-8cjw-p6xm), through the `shadcn` CLI. See waiver E3.

---

## 7. Waivers

### Waiver E1: Manual screen-reader spot check (task 12.3)
Reason: The keyboard-only pass is automated (Tab order, focus visible, keyboard drag-and-drop, axe on every screen). A real screen-reader pass (NVDA or Narrator on Windows, VoiceOver on iOS) needs a person listening, and wasn't done.
Owner: umpiremed@gmail.com
Revisit by: Before the Growth stage launch decision.

### Waiver E2: Real third-party services and deployment not exercised
Reason: Google OAuth, Drive and Calendar, Gemini, OpenRouter, Jira Cloud and the deployed Vercel function were tested only against faithful fakes. Their real use needs:
- the owner's Google OAuth client ID
- AI keys and a Jira site
- a Vercel deploy with `ALLOWED_ORIGIN` set

CORS for Gemini and OpenRouter from the deployed origin, real voice output, and lock-screen behavior (PRD RK2) are also unverified. NFR10 (cost) is satisfied by design (Vercel Hobby, no paid services) but not yet observed on a real deploy.
Owner: umpiremed@gmail.com
Revisit by: First deploy (smoke test each integration once).

### Waiver E3: Dev-only `npm audit` findings (`braces` via the `shadcn` CLI)
Reason:
- The vulnerable code is only in the `shadcn` command-line tool's glob matching. It's a devDependency, not in the built app (checked: `dist/` contains none of it), and never receives untrusted input.
- The only fix npm offers is downgrading `shadcn` to 1.0.0, a breaking change.
- Production dependencies have 0 vulnerabilities.

Owner: umpiremed@gmail.com
Revisit by: Next dependency update; upgrade `shadcn` when it ships fixed versions.

### Waiver E4: Jira proxy rate limit is per instance
Reason: Vercel function instances don't share memory, so the 60 requests/minute limit applies per instance, not globally. A shared limit would need a store such as KV, which adds cost and a dependency. The allow-list and origin check already prevent use as an open proxy (PRD RK4).
Owner: umpiremed@gmail.com
Revisit by: If Vercel usage shows abuse, or before a public release.
