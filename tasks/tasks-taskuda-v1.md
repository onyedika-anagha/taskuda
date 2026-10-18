# Tasks — Taskuda v1

Source documents:
- PRD: `docs/pm/taskuda-prd.md` (requirement IDs: FR, NFR, AC, CR)
- Design spec: `docs/design/taskuda-design-spec.md` (screen IDs: S, D; flows: F; design criteria: DAC)

Order follows PRD priorities: all Must work (tasks 1.0–8.0) comes before Should work (tasks 9.0–11.0).

## Relevant Files

### App and pages
- `src/main.tsx` - App entry; mounts React and registers the service worker.
- `src/app/App.tsx` - Root component; providers and router outlet.
- `src/app/router.tsx` - Routes: `/`, `/day/:date`, `/report`, `/settings/:section`, `/welcome`.
- `src/pages/TodayPage.tsx` - S2; composes canvas components only.
- `src/pages/ReportPage.tsx` - S6.
- `src/pages/SettingsPage.tsx` - S7; composes settings sections.
- `src/pages/WelcomePage.tsx` - S1.

### Components (`src/components/`)
- `ui/*` - shadcn/ui components (generated, [REUSE]).
- `layout/AppShell.tsx`, `layout/AppBar.tsx`, `layout/OfflineBanner.tsx`, `layout/SyncStatusIndicator.tsx`, `layout/InstallPrompt.tsx` - App shell pieces.
- `canvas/DayNavigator.tsx`, `canvas/TimeBlockColumn.tsx`, `canvas/TimeBlockTabs.tsx`, `canvas/EmptyBlockState.tsx`, `canvas/ReminderCatchup.tsx` - S2 layout pieces.
- `task/StickyNote.tsx`, `task/StatusToggle.tsx`, `task/TaskEditor.tsx`, `task/TaskMenu.tsx`, `task/DeleteTaskDialog.tsx`, `task/TimedTaskMoveDialog.tsx`, `task/LinkJiraIssueDialog.tsx` - Task UI.
- `company/CompanyChip.tsx`, `company/ColorSwatchPicker.tsx`, `company/DeleteCompanyDialog.tsx` - Company UI.
- `closeout/CloseoutDialog.tsx`, `closeout/CloseoutStepper.tsx`, `closeout/UnfinishedStep.tsx`, `closeout/OutcomeChooser.tsx`, `closeout/ReflectStep.tsx`, `closeout/RatingInput.tsx`, `closeout/RecommendationsStep.tsx`, `closeout/RecommendationList.tsx`, `closeout/ReportStep.tsx` - S5.
- `report/ReportBuilder.tsx`, `report/FormatSwitcher.tsx`, `report/ReportPreview.tsx` - Shared by S5 step 4 and S6.
- `settings/CompaniesSection.tsx`, `settings/IntegrationsSection.tsx`, `settings/BackupSection.tsx`, `settings/AiSecuritySection.tsx`, `settings/VoiceSection.tsx`, `settings/StatsSection.tsx`, `settings/AboutSection.tsx`, `settings/IntegrationCard.tsx`, `settings/MetricTile.tsx` - S7.
- `security/SecretField.tsx`, `security/SetPassphraseDialog.tsx`, `security/UnlockDialog.tsx` - Secrets UI.
- `backup/RestoreConfirmDialog.tsx`, `backup/BackupVersionList.tsx` - Restore UI.
- `welcome/WelcomeStepper.tsx` and step components - S1.

### Hooks (`src/hooks/`)
- `useTasksForDay.ts`, `useCompanies.ts`, `useOnlineStatus.ts`, `useKeyboardShortcuts.ts`, `useCloseout.ts`, `useReport.ts`, `useMetrics.ts`, `useBackupStatus.ts`, `useCalendarSync.ts`, `useReminders.ts`, `useInstallPrompt.ts`, `useServiceWorkerUpdate.ts` - Connect components to stores and services.

### Stores (`src/stores/`)
- `taskStore.ts`, `companyStore.ts`, `closeoutStore.ts`, `settingsStore.ts`, `syncStore.ts`, `secretsStore.ts` - Zustand UI state; persist through repositories.

### Services (`src/services/`)
- `db/database.ts` - Dexie schema and migrations.
- `db/taskRepository.ts`, `db/companyRepository.ts`, `db/closeoutRepository.ts`, `db/activityLogRepository.ts`, `db/settingsRepository.ts`, `db/calendarMappingRepository.ts` - Data access.
- `crypto/secretVault.ts` - Passphrase key derivation, encrypt/decrypt, device key.
- `google/googleAuth.ts` - Google Identity Services token client and silent renewal.
- `google/driveBackup.ts` - Backup, version list, restore (app-data folder).
- `google/calendarSync.ts` - Two-way sync with sync tokens and mapping.
- `ai/aiProvider.ts`, `ai/geminiClient.ts`, `ai/openRouterClient.ts`, `ai/buildRecommendationPrompt.ts` - AI calls.
- `jira/jiraClient.ts` - Calls the proxy.
- `voice/speechService.ts` - Web Speech wrapper and support detection.
- `reminders/reminderScheduler.ts` - Schedules reminders, records missed ones.
- `backup/exportImport.ts` - File export/import (CR2).

### Utils (`src/utils/`)
- `timeBlocks.ts` - Block from time, block ranges.
- `dates.ts` - Day keys, working-day checks (date-fns).
- `reportFormatters.ts` - Slack/Teams/Jira/Email text.
- `metrics.ts` - M1–M3 calculations.
- `companyPalette.ts` - 10-color palette with light/dark tokens.
- `clipboard.ts` - Copy with fallback.

### Types and schemas
- `src/types/*.ts` - Task, Company, Closeout, ActivityEvent, Settings, Secrets.
- `src/schemas/*.ts` - Zod schemas for forms and the backup file.

### Serverless
- `api/jira.ts` - Vercel function: Jira proxy (allow-list, origin check, rate limit, no logging of bodies).

### Config
- `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `tailwind.config.ts` (or CSS config), `components.json`, `vercel.json`, `playwright.config.ts`, `vitest.config.ts`, `.env.example`.

### Tests
- Unit/component tests sit next to the file they test as `*.test.ts(x)` (for example `src/utils/timeBlocks.test.ts`, `src/components/task/StatusToggle.test.tsx`).
- `api/jira.test.ts` - Proxy restriction tests.
- `e2e/*.spec.ts` - Playwright flows: `tasks.spec.ts`, `closeout.spec.ts`, `report.spec.ts`, `offline.spec.ts`, `a11y.spec.ts`, `responsive.spec.ts`, `secrets.spec.ts`.

### Docs
- `README.md`, `CHANGELOG.md`, `docs/engineering/taskuda-impl-notes.md`.

### Notes

- Pages only compose components. Logic lives in hooks, stores, services, and utils (workspace code-separation rule).
- Unit tests sit next to the code they test. Run `npx vitest` (all) or `npx vitest src/utils/timeBlocks.test.ts` (one file). Run e2e with `npx playwright test`.
- External services (Google, Gemini, OpenRouter, Jira) are mocked in unit and e2e tests. Never use real keys in tests or commits.
- Every acceptance criterion (AC, DAC) should be named in the test title, for example `it("AC4.1 cycles To Do → In Progress → Done")`, so coverage can be traced in the implementation notes.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and check out a new branch: `git checkout -b feature/taskuda-v1`

- [ ] 1.0 Scaffold the project and tooling
  - [ ] 1.1 Create a Vite React + TypeScript project in the repo root (strict TypeScript on)
  - [ ] 1.2 Add Tailwind CSS and initialize shadcn/ui; add the [REUSE] components from the design spec Section 5
  - [ ] 1.3 Set up the folder structure from "Relevant Files" (`components/`, `pages/`, `hooks/`, `stores/`, `services/`, `utils/`, `types/`, `schemas/`)
  - [ ] 1.4 Add ESLint (with the jsx-a11y plugin) and Prettier; add `lint`, `typecheck`, `test`, `e2e`, `build` scripts
  - [ ] 1.5 Set up Vitest + React Testing Library with jsdom and `fake-indexeddb`; add one passing sample test
  - [ ] 1.6 Set up Playwright with desktop (1280px), tablet (768px), and mobile (320px) projects; add `@axe-core/playwright`
  - [ ] 1.7 Add `vite-plugin-pwa` (Workbox): app-shell caching, web manifest, icons, prompt-to-update mode
  - [ ] 1.8 Add `vercel.json`: single-page-app fallback to `index.html`, no-cache on `sw.js`, and security headers (Content Security Policy allowing only Google, Gemini, OpenRouter, and the app's own `/api`; `X-Content-Type-Options`; `Referrer-Policy`; `frame-ancestors 'none'`)
  - [ ] 1.9 Add `.env.example` with `VITE_GOOGLE_CLIENT_ID` and `ALLOWED_ORIGIN`; confirm `.env*` (except the example) is in `.gitignore`
  - [ ] 1.10 Set up routing (`src/app/router.tsx`) with placeholder pages for the routes in design spec Section 4
  - [ ] 1.11 Light and dark theme tokens as CSS variables, following the system setting (design spec Section 10)

- [ ] 2.0 Build the local data layer
  - [ ] 2.1 Define types in `src/types/`: Task (id, title, notes, companyId, dayKey, block, order, startTime, durationMinutes, status, carriedOverCount, source, jiraIssue, timestamps), Company, Closeout, ActivityEvent, Settings
  - [ ] 2.2 Create the Dexie schema in `services/db/database.ts` with indexes on `dayKey`, `companyId`, and `[dayKey+block+order]`; version the schema so later migrations are possible
  - [ ] 2.3 Write repositories for tasks, companies, closeouts, settings, and calendar mappings; each write also appends an ActivityEvent (created, status changed, moved, carried over, deleted)
  - [ ] 2.4 Write `utils/timeBlocks.ts` (block for a time; ranges 05:00–11:59, 12:00–16:59, 17:00–04:59) and `utils/dates.ts` (day keys, working days) with unit tests
  - [ ] 2.5 Create Zustand stores (`taskStore`, `companyStore`, `settingsStore`) that update the UI and write through the repositories immediately (NFR2)
  - [ ] 2.6 Detect when storage is unavailable (private mode or blocked) and expose a `storageError` flag for the S2 error state
  - [ ] 2.7 Unit tests: repository CRUD, activity events written for each change, reorder logic, storage-error detection

- [ ] 3.0 Build the Today canvas
  - [ ] 3.1 AppShell and AppBar (desktop layout, plus mobile floating Add button and bottom action bar)
  - [ ] 3.2 DayNavigator with prev / next / Today; past days read-only with banner; `/day/:date` route
  - [ ] 3.3 `utils/companyPalette.ts` with the 10 colors and light/dark tokens; a unit test that checks ≥ 4.5:1 text contrast for each (DAC11)
  - [ ] 3.4 CompanyChip, ColorSwatchPicker, and the Companies settings section (add, rename, recolor, delete with D3; duplicate-name error) — FR5
  - [ ] 3.5 TimeBlockColumn (desktop/tablet), TimeBlockTabs with task counts (mobile < 768px), and EmptyBlockState with "Add a task" link — FR1
  - [ ] 3.6 StickyNote with company tint, carried-over marker, calendar icon, Jira key, and a full screen-reader label
  - [ ] 3.7 StatusToggle cycling To Do → In Progress → Done → To Do, icon + label, aria-label — FR4, DAC2
  - [ ] 3.8 TaskEditor (Dialog ≥ 768px, Sheet < 768px) using React Hook Form + Zod: title required, block defaults to current time, start time sets the block — FR2
  - [ ] 3.9 TaskMenu: edit, set status, move to block, move up/down, delete (D1)
  - [ ] 3.10 Drag-and-drop with @dnd-kit: within and across blocks, keyboard sensor with announcements, 200 ms touch long-press, drop onto a tab on mobile; D2 when a timed task is dropped in the wrong block — FR3
  - [ ] 3.11 Keyboard shortcuts `N`, `T`, `[`, `]`, `?` (ignored while typing in a field)
  - [ ] 3.12 OfflineBanner, storage-error Alert, Skeleton loading state, toasts — NFR1
  - [ ] 3.13 Component tests for StatusToggle, TaskEditor validation, StickyNote labels, Companies section; e2e `tasks.spec.ts` covering AC1.x–AC5.x, DAC1, DAC3, DAC6, DAC9; `offline.spec.ts` for AC6.1–AC6.2

- [ ] 4.0 Build secret storage
  - [ ] 4.1 `services/crypto/secretVault.ts`: derive a key from the passphrase with PBKDF2 (SHA-256, high iteration count) and a random salt; encrypt secrets with AES-GCM
  - [ ] 4.2 Device unlock: after the passphrase is entered once, store a non-extractable AES-GCM `CryptoKey` in IndexedDB that unlocks secrets on this device without the passphrase (AC12.4)
  - [ ] 4.3 Keep secrets encrypted at rest; decrypted values live only in memory and are never written to logs, the activity log, or exported files
  - [ ] 4.4 SetPassphraseDialog (D6: min 8 characters, confirm match) and UnlockDialog (D5: wrong-passphrase error, "Restore without keys")
  - [ ] 4.5 SecretField showing only the last 4 characters after save (DAC14); "Change passphrase" and "Reset secrets"
  - [ ] 4.6 Unit tests: encrypt/decrypt round trip, wrong passphrase fails, stored data contains no plaintext key (AC12.3), reset removes secrets

- [ ] 5.0 Build the EOD closeout, carryover, report builder, and local stats
  - [ ] 5.1 `closeoutStore` and `useCloseout`: step state, outcomes per task, rating, reflection, draft saved so the closeout can be resumed (DAC13), start timestamp
  - [ ] 5.2 UnfinishedStep with OutcomeChooser, "Carry over all", and the "still need a decision" counter; Next disabled until every task has an outcome (AC10.1)
  - [ ] 5.3 ReflectStep with RatingInput (required) and reflection text (AC10.2)
  - [ ] 5.4 Finish: apply carryover (copy to the next day, same block, keep status, increase `carriedOverCount`), apply deletes, save the closeout log (AC10.3, AC11.1, AC11.2); "Day closed" banner; "Close out again" replaces the day's entry
  - [ ] 5.5 `utils/reportFormatters.ts`: Slack, Teams, Jira, and Email text with Done / In progress / Carried to tomorrow sections, per company or all (AC14.1, AC14.2, AC14.4)
  - [ ] 5.6 ReportBuilder, FormatSwitcher, ReportPreview shared by closeout step 4 and S6; `utils/clipboard.ts` with the manual-copy fallback; save copy time for M3 (AC14.3, DAC5)
  - [ ] 5.7 `utils/metrics.ts` (M1 silently-dropped count, M2 streak over working days, M3 median minutes) and StatsSection with MetricTiles (FR17)
  - [ ] 5.8 Leave-closeout confirmation and the "already closed" state
  - [ ] 5.9 Tests: unit tests for formatters and metrics; e2e `closeout.spec.ts` (AC10.x, AC11.x, DAC4, DAC13) and `report.spec.ts` (AC14.x, DAC5)

- [ ] 6.0 Build AI recommendations with the user's own key
  - [ ] 6.1 AI & Security settings section: provider (Gemini / OpenRouter), API key (SecretField, triggers D6 on first secret), model with a preset default, Test key, Remove key, spending-limit tip (AC12.1, AC12.2)
  - [ ] 6.2 `geminiClient.ts` and `openRouterClient.ts` behind one `aiProvider.ts` interface; send the key only to that provider's domain (AC12.6); timeout and clear error reasons (rejected key, rate limit, timeout)
  - [ ] 6.3 `buildRecommendationPrompt.ts`: today's task titles, statuses, companies, carryovers, rating, and reflection only
  - [ ] 6.4 RecommendationsStep: first-time disclosure (AC13.3), loading, results, no-key, offline, provider error with Try again; Skip always available (AC13.1, AC13.2)
  - [ ] 6.5 Tests: prompt builder unit test, client error mapping with mocked fetch, network check that the key goes only to the provider (AC12.6)

- [ ] 7.0 Build Google sign-in and Drive backup/restore
  - [ ] 7.1 `googleAuth.ts` using Google Identity Services token client; request scopes only when the feature is turned on (`drive.appdata` for backup); silent renewal before expiry; "Reconnect Google" state when renewal fails
  - [ ] 7.2 Define the backup file format with a Zod schema (version, device name, created time, data, encrypted secrets)
  - [ ] 7.3 `driveBackup.ts`: automatic backup after changes (debounced, online only), keep previous versions, list versions, restore one
  - [ ] 7.4 BackupSection with status, Back up now, Restore from Drive, BackupVersionList, RestoreConfirmDialog (D4) with the different-device warning, then D5 if secrets are present (AC7.1–AC7.4)
  - [ ] 7.5 SyncStatusIndicator states: saved locally, backed up, backing up, offline, reconnect, failed
  - [ ] 7.6 Export to file / Import from file using the same backup format (CR2)
  - [ ] 7.7 Tests: backup schema validation, restore replaces data, unreadable backup error, consent scope check (AC7.3) with mocked Google APIs

- [ ] 8.0 Build first-run onboarding, settings shell, and PWA prompts
  - [ ] 8.1 SettingsPage with side nav (≥ 1024px) and list → subpage (smaller screens); AboutSection with version and privacy text
  - [ ] 8.2 WelcomePage (S1): intro, first company, connect Drive, restore-if-found; skip paths; redirect to `/` afterwards
  - [ ] 8.3 InstallPrompt (dismiss hides it for 30 days) and update toast with Reload (AC16.1, AC16.2)
  - [ ] 8.4 Tests: onboarding skip and complete paths; update toast appears when a new service worker is waiting

- [ ] 9.0 Build Google Calendar two-way sync (Should)
  - [ ] 9.1 Calendar card in IntegrationsSection: connect (events scope plus calendar list), choose calendar, turn sync off (keeps tasks)
  - [ ] 9.2 `calendarMappingRepository`: stable task id ↔ event id mapping
  - [ ] 9.3 Push: timed tasks create/update/delete their mapped event (AC8.1, AC8.2, AC8.4)
  - [ ] 9.4 Pull: incremental sync with sync tokens while the app is open (on open, on focus, and every few minutes); events become calendar-sourced tasks on the right day and block (AC8.3); handle expired sync tokens with a full resync
  - [ ] 9.5 Decide and document the conflict rule (which side wins when both changed) in the implementation notes; implement it
  - [ ] 9.6 "Calendar sync paused" error state; optional "Use your own Google client ID" (CR1)
  - [ ] 9.7 Tests with a mocked Calendar API: no duplicates on repeated sync (AC8.5), update and delete both ways, conflict rule

- [ ] 10.0 Build the voice engine and reminder catch-up (Should)
  - [ ] 10.1 `speechService.ts`: support detection, voice list, speak, cancel
  - [ ] 10.2 VoiceSection: on/off, lead time (Off/5/10/15, default 5), voice choice, Play test, unsupported state (AC9.3, AC9.4)
  - [ ] 10.3 `reminderScheduler.ts`: schedule "up next" and "starting now" for today's timed tasks; reschedule on task changes; completion cheer on Done (AC9.1, AC9.2)
  - [ ] 10.4 On return from background, detect reminders that were missed and show ReminderCatchup (AC9.5)
  - [ ] 10.5 Every spoken alert also shows a toast (DAC12)
  - [ ] 10.6 Tests with fake timers and mocked speech: timing, catch-up, toasts

- [ ] 11.0 Build the Jira proxy function and Jira integration (Should)
  - [ ] 11.1 `api/jira.ts` Vercel function: forward only to `https://<site>.atlassian.net/rest/...`; reject other hosts; require the `Origin` to equal `ALLOWED_ORIGIN`; rate limit per client; never log request bodies, headers, or tokens (NFR6, AC15.4)
  - [ ] 11.2 Jira card: site, email, API token (SecretField), Test connection; status mapping selects (AC15.1)
  - [ ] 11.3 `jiraClient.ts`: look up issue, update status through the proxy; clear error mapping (not found, no access, rejected token, offline)
  - [ ] 11.4 LinkJiraIssueDialog (D7) from TaskEditor; issue key, title, status shown on the note (AC15.2)
  - [ ] 11.5 Status change on a linked task updates Jira when a mapping exists (AC15.3)
  - [ ] 11.6 Tests: proxy rejects other hosts and origins, rate limit, no logging; client error mapping

- [ ] 12.0 Final pass
  - [ ] 12.1 `a11y.spec.ts`: axe shows 0 WCAG 2.1 AA violations on S2, S3, each S5 step, S6, and each S7 section (DAC10)
  - [ ] 12.2 `responsive.spec.ts`: every screen at 320px, 768px, and 1280px with no horizontal scrolling (DAC8)
  - [ ] 12.3 Manual keyboard-only pass and screen-reader spot check on S2 and S5
  - [ ] 12.4 Performance check: repeat-load under 2 s, smooth drag with 50 tasks (NFR3)
  - [ ] 12.5 Run `npm audit`; resolve critical/high issues
  - [ ] 12.6 Grep the repo for hardcoded secrets (API keys, tokens, client secrets)
  - [ ] 12.7 User-relevance review of every screen (no raw IDs, enums, or timestamps shown)
  - [ ] 12.8 Write `README.md` (setup, env vars, Google Cloud setup, deploy to Vercel) and `CHANGELOG.md`
  - [ ] 12.9 Write `docs/engineering/taskuda-impl-notes.md`: technical design summary, the four open decisions from the design spec, test plan mapping every AC/DAC to its test, Definition of Done checklist
  - [ ] 12.10 Lint, typecheck, unit tests, e2e, and build all pass; commit
