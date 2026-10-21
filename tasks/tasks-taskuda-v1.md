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
- `vite.config.ts`, `tsconfig.json`, `.oxlintrc.json`, `src/index.css` (Tailwind v4 CSS config), `components.json`, `vercel.json`, `playwright.config.ts`, `vitest.config.ts`, `.env.example`.

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
- `- [x] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and check out a new branch: `git checkout -b feature/taskuda-v1`

- [x] 1.0 Scaffold the project and tooling
  - [x] 1.1 Create a Vite React + TypeScript project in the repo root (strict TypeScript on)
  - [x] 1.2 Add Tailwind CSS and initialize shadcn/ui; add the [REUSE] components from the design spec Section 5
  - [x] 1.3 Set up the folder structure from "Relevant Files" (`components/`, `pages/`, `hooks/`, `stores/`, `services/`, `utils/`, `types/`, `schemas/`)
  - [x] 1.4 Add oxlint (the Vite template linter, with the jsx-a11y plugin) and Prettier; add `lint`, `typecheck`, `test`, `e2e`, `build` scripts
  - [x] 1.5 Set up Vitest + React Testing Library with jsdom and `fake-indexeddb`; add one passing sample test
  - [x] 1.6 Set up Playwright with desktop (1280px), tablet (768px), and mobile (320px) projects; add `@axe-core/playwright`
  - [x] 1.7 Add `vite-plugin-pwa` (Workbox): app-shell caching, web manifest, icons, prompt-to-update mode
  - [x] 1.8 Add `vercel.json`: single-page-app fallback to `index.html`, no-cache on `sw.js`, and security headers (Content Security Policy allowing only Google, Gemini, OpenRouter, and the app's own `/api`; `X-Content-Type-Options`; `Referrer-Policy`; `frame-ancestors 'none'`)
  - [x] 1.9 Add `.env.example` with `VITE_GOOGLE_CLIENT_ID` and `ALLOWED_ORIGIN`; confirm `.env*` (except the example) is in `.gitignore`
  - [x] 1.10 Set up routing (`src/app/router.tsx`) with placeholder pages for the routes in design spec Section 4
  - [x] 1.11 Light and dark theme tokens as CSS variables, following the system setting (design spec Section 10)

- [x] 2.0 Build the local data layer
  - [x] 2.1 Define types in `src/types/`: Task (id, title, notes, companyId, dayKey, block, order, startTime, durationMinutes, status, carriedOverCount, source, jiraIssue, timestamps), Company, Closeout, ActivityEvent, Settings
  - [x] 2.2 Create the Dexie schema in `services/db/database.ts` with indexes on `dayKey`, `companyId`, and `[dayKey+block+order]`; version the schema so later migrations are possible
  - [x] 2.3 Write repositories for tasks, companies, closeouts, settings, and calendar mappings; each write also appends an ActivityEvent (created, status changed, moved, carried over, deleted)
  - [x] 2.4 Write `utils/timeBlocks.ts` (block for a time; ranges 05:00–11:59, 12:00–16:59, 17:00–04:59) and `utils/dates.ts` (day keys, working days) with unit tests
  - [x] 2.5 Reads use Dexie live queries (`useTasksForDay`, `useCompanies`) so background sync updates the UI; writes go through repositories immediately (NFR2); Zustand holds UI state only (`appStatusStore`)
  - [x] 2.6 Detect when storage is unavailable (private mode or blocked) and expose a `storageError` flag for the S2 error state
  - [x] 2.7 Unit tests: repository CRUD, activity events written for each change, reorder logic, storage-error detection

- [x] 3.0 Build the Today canvas
  - [x] 3.1 AppShell and AppBar (desktop layout, plus mobile floating Add button and bottom action bar)
  - [x] 3.2 DayNavigator with prev / next / Today; past days read-only with banner; `/day/:date` route
  - [x] 3.3 `utils/companyPalette.ts` with the 10 colors and light/dark tokens; a unit test that checks ≥ 4.5:1 text contrast for each (DAC11) (done early, with the data layer)
  - [x] 3.4 CompanyChip, ColorSwatchPicker, and the Companies settings section (add, rename, recolor, delete with D3; duplicate-name error) — FR5
  - [x] 3.5 TimeBlockColumn (desktop/tablet), TimeBlockTabs with task counts (mobile < 768px), and EmptyBlockState with "Add a task" link — FR1
  - [x] 3.6 StickyNote with company tint, carried-over marker, calendar icon, Jira key, and a full screen-reader label
  - [x] 3.7 StatusToggle cycling To Do → In Progress → Done → To Do, icon + label, aria-label — FR4, DAC2
  - [x] 3.8 TaskEditor (Dialog ≥ 768px, Sheet < 768px) using React Hook Form + Zod: title required, block defaults to current time, start time sets the block — FR2
  - [x] 3.9 TaskMenu: edit, set status, move to block, move up/down, delete (D1)
  - [x] 3.10 Drag-and-drop with @dnd-kit: within and across blocks, keyboard sensor with announcements, drag from the note handle on all devices, drop onto a tab on mobile; D2 when a timed task is dropped in the wrong block — FR3
  - [x] 3.11 Keyboard shortcuts `N`, `T`, `[`, `]`, `?` (ignored while typing in a field)
  - [x] 3.12 OfflineBanner, storage-error Alert, Skeleton loading state, toasts — NFR1
  - [x] 3.13 Component tests for StatusToggle, TaskEditor validation, StickyNote labels, Companies section; e2e `tasks.spec.ts` covering AC1.x–AC5.x, DAC1, DAC3, DAC6, DAC9; `offline.spec.ts` for AC6.1–AC6.2

- [x] 4.0 Build secret storage
  - [x] 4.1 `services/crypto/secretVault.ts`: derive a key from the passphrase with PBKDF2 (SHA-256, high iteration count) and a random salt; encrypt secrets with AES-GCM
  - [x] 4.2 Device unlock: after the passphrase is entered once, store a non-extractable AES-GCM `CryptoKey` in IndexedDB that unlocks secrets on this device without the passphrase (AC12.4); the vault stores an encrypted key-check value so a device key from an older vault is rejected
  - [x] 4.3 Keep secrets encrypted at rest; decrypted values live only in memory and are never written to logs, the activity log, or exported files
  - [x] 4.4 SetPassphraseDialog (D6: min 8 characters, confirm match) and UnlockDialog (D5: wrong-passphrase error, "Restore without keys")
  - [x] 4.5 SecretField showing only the last 4 characters after save (DAC14); "Change passphrase" and "Reset secrets"
  - [x] 4.6 Unit tests: encrypt/decrypt round trip, wrong passphrase fails, stored data contains no plaintext key (AC12.3), reset removes secrets

- [x] 5.0 Build the EOD closeout, carryover, report builder, and local stats
  - [x] 5.1 `closeoutStore` and `useCloseout`: step state, outcomes per task, rating, reflection, draft saved so the closeout can be resumed (DAC13), start timestamp
  - [x] 5.2 UnfinishedStep with OutcomeChooser, "Carry over all", and the "still need a decision" counter; Next disabled until every task has an outcome (AC10.1)
  - [x] 5.3 ReflectStep with RatingInput (required) and reflection text (AC10.2)
  - [x] 5.4 Finish: apply carryover (copy to the next day, same block, keep status, increase `carriedOverCount`), apply deletes, save the closeout log (AC10.3, AC11.1, AC11.2); "Day closed" banner; "Close out again" replaces the day's entry
  - [x] 5.5 `utils/reportFormatters.ts`: Slack, Teams, Jira, and Email text with Done / In progress / Carried to tomorrow sections, per company or all (AC14.1, AC14.2, AC14.4)
  - [x] 5.6 ReportBuilder, FormatSwitcher, ReportPreview shared by closeout step 4 and S6; `utils/clipboard.ts` with the manual-copy fallback; save copy time for M3 (AC14.3, DAC5)
  - [x] 5.7 `utils/metrics.ts` (M1 silently-dropped count, M2 streak over working days, M3 median minutes) and StatsSection with MetricTiles (FR17)
  - [x] 5.8 Leave-closeout confirmation and the "already closed" state
  - [x] 5.9 Tests: unit tests for formatters and metrics; e2e `closeout.spec.ts` (AC10.x, AC11.x, DAC4, DAC13) and `report.spec.ts` (AC14.x, DAC5)

- [x] 6.0 Build AI recommendations with the user's own key
  - [x] 6.1 AI & Security settings section: provider (Gemini / OpenRouter), API key (SecretField, triggers D6 on first secret), model with a preset default, Test key, Remove key, spending-limit tip (AC12.1, AC12.2)
  - [x] 6.2 `geminiClient.ts` and `openRouterClient.ts` behind one `aiProvider.ts` interface; send the key only to that provider's domain (AC12.6); timeout and clear error reasons (rejected key, rate limit, timeout)
  - [x] 6.3 `buildRecommendationPrompt.ts`: today's task titles, statuses, companies, carryovers, rating, and reflection only
  - [x] 6.4 RecommendationsStep: first-time disclosure (AC13.3), loading, results, no-key, offline, provider error with Try again; Skip always available (AC13.1, AC13.2)
  - [x] 6.5 Tests: prompt builder unit test, client error mapping with mocked fetch, network check that the key goes only to the provider (AC12.6)

- [x] 7.0 Build Google sign-in and Drive backup/restore
  - [x] 7.1 `googleAuth.ts` using Google Identity Services token client; request scopes only when the feature is turned on (`drive.appdata` for backup); silent renewal before expiry; "Reconnect Google" state when renewal fails
  - [x] 7.2 Define the backup file format with a Zod schema (version, device name, created time, data, encrypted secrets)
  - [x] 7.3 `driveBackup.ts`: automatic backup after changes (debounced, online only), keep previous versions, list versions, restore one
  - [x] 7.4 BackupSection with status, Back up now, Restore from Drive, BackupVersionList, RestoreConfirmDialog (D4) with the different-device warning, then D5 if secrets are present (AC7.1–AC7.4)
  - [x] 7.5 SyncStatusIndicator states: saved locally, backed up, backing up, offline, reconnect, failed
  - [x] 7.6 Export to file / Import from file using the same backup format (CR2)
  - [x] 7.7 Tests: backup schema validation, restore replaces data, unreadable backup error, consent scope check (AC7.3) with mocked Google APIs

- [x] 8.0 Build first-run onboarding, settings shell, and PWA prompts
  - [x] 8.1 SettingsPage with side nav (≥ 1024px) and list → subpage (smaller screens); AboutSection with version and privacy text
  - [x] 8.2 WelcomePage (S1): intro, first company, connect Drive, restore-if-found; skip paths; redirect to `/` afterwards
  - [x] 8.3 InstallPrompt (dismiss hides it for 30 days) and update toast with Reload (AC16.1, AC16.2)
  - [x] 8.4 Tests: onboarding skip and complete paths; update toast appears when a new service worker is waiting

- [x] 9.0 Build Google Calendar two-way sync (Should)
  - [x] 9.1 Calendar card in IntegrationsSection: connect (events scope plus calendar list), choose calendar, turn sync off (keeps tasks)
  - [x] 9.2 `calendarMappingRepository`: stable task id ↔ event id mapping
  - [x] 9.3 Push: timed tasks create/update/delete their mapped event (AC8.1, AC8.2, AC8.4)
  - [x] 9.4 Pull: incremental sync with sync tokens while the app is open (on open, on focus, and every few minutes); events become calendar-sourced tasks on the right day and block (AC8.3); handle expired sync tokens with a full resync
  - [x] 9.5 Decide and document the conflict rule (which side wins when both changed) in the implementation notes; implement it
  - [x] 9.6 "Calendar sync paused" error state; optional "Use your own Google client ID" (CR1)
  - [x] 9.7 Tests with a mocked Calendar API: no duplicates on repeated sync (AC8.5), update and delete both ways, conflict rule

- [x] 10.0 Build the voice engine and reminder catch-up (Should)
  - [x] 10.1 `speechService.ts`: support detection, voice list, speak, cancel
  - [x] 10.2 VoiceSection: on/off, lead time (Off/5/10/15, default 5), voice choice, Play test, unsupported state (AC9.3, AC9.4)
  - [x] 10.3 `reminderScheduler.ts`: schedule "up next" and "starting now" for today's timed tasks; reschedule on task changes; completion cheer on Done (AC9.1, AC9.2)
  - [x] 10.4 On return from background, detect reminders that were missed and show ReminderCatchup (AC9.5)
  - [x] 10.5 Every spoken alert also shows a toast (DAC12)
  - [x] 10.6 Tests with fake timers and mocked speech: timing, catch-up, toasts

- [x] 11.0 Build the Jira proxy function and Jira integration (Should)
  - [x] 11.1 `api/jira.ts` Vercel function: forward only to `https://<site>.atlassian.net/rest/...`; reject other hosts; require the `Origin` to equal `ALLOWED_ORIGIN`; rate limit per client; never log request bodies, headers, or tokens (NFR6, AC15.4)
  - [x] 11.2 Jira card: site, email, API token (SecretField), Test connection; status mapping selects (AC15.1)
  - [x] 11.3 `jiraClient.ts`: look up issue, update status through the proxy; clear error mapping (not found, no access, rejected token, offline)
  - [x] 11.4 LinkJiraIssueDialog (D7) from TaskEditor; issue key, title, status shown on the note (AC15.2)
  - [x] 11.5 Status change on a linked task updates Jira when a mapping exists (AC15.3)
  - [x] 11.6 Tests: proxy rejects other hosts and origins, rate limit, no logging; client error mapping

- [x] 12.0 Final pass
  - [x] 12.1 `a11y.spec.ts`: axe shows 0 WCAG 2.1 AA violations on S2, S3, each S5 step, S6, and each S7 section (DAC10)
  - [x] 12.2 `responsive.spec.ts`: every screen at 320px, 768px, and 1280px with no horizontal scrolling (DAC8)
  - [x] 12.3 Manual keyboard-only pass and screen-reader spot check on S2 and S5 — keyboard pass automated in e2e/a11y.spec.ts; screen-reader check waived (impl notes E1)
  - [x] 12.4 Performance check: repeat-load under 2 s, smooth drag with 50 tasks (NFR3)
  - [x] 12.5 Run `npm audit`; resolve critical/high issues
  - [x] 12.6 Grep the repo for hardcoded secrets (API keys, tokens, client secrets)
  - [x] 12.7 User-relevance review of every screen (no raw IDs, enums, or timestamps shown)
  - [x] 12.8 Write `README.md` (setup, env vars, Google Cloud setup, deploy to Vercel) and `CHANGELOG.md`
  - [x] 12.9 Write `docs/engineering/taskuda-impl-notes.md`: technical design summary, the four open decisions from the design spec, test plan mapping every AC/DAC to its test, Definition of Done checklist
  - [x] 12.10 Lint, typecheck, unit tests, e2e, and build all pass; commit

## Additions — 2026-10-20 (PRD FR18–FR29, design F14–F17, S7h, D8, DAC15–DAC21)

Adopted from the My Work Day PRD. These are Should items in v1 scope, built on `feature/taskuda-v1` in the PRD RK11 order.

### Relevant Files (additions)

- `src/services/db/taskRepository.ts` - `restoreTask` for undo; carryover copies keep `seriesId`.
- `src/services/db/database.ts` - New schema versions: eye-break log and in-app time (18.0), recurring series (19.0).
- `src/types/activity.ts` - New `task_restored` event type.
- `src/types/workday.ts` - Working days, closeout reminder, quiet hours, eye-break and budget settings.
- `src/services/workday/workdaySettings.ts` - Read/write Workday settings with defaults and validation.
- `src/services/workday/closeoutNudge.ts` - Pure "should the nudge show / toast / speak" decision.
- `src/services/eyeBreaks/eyeBreakPlan.ts` - Pure eye-break scheduling (interval, hours, quiet hours, missed).
- `src/services/screenTime/screenTimeTracker.ts` - Counts visible time per day on this device.
- `src/services/recurring/occurrenceService.ts` - Creates occurrences for today/future days, applies edit/delete scopes.
- `src/types/recurring.ts` - RecurringSeries and repeat pattern types.
- `src/utils/dates.ts` - `isWorkingDay(dayKey, workingDays)`, `nextWorkingDay`.
- `src/utils/timeBlocks.ts` - Block end times and minutes left.
- `src/utils/quietHours.ts` - Is a time inside a (possibly overnight) range.
- `src/utils/overlaps.ts` - Which timed tasks overlap.
- `src/utils/recurrence.ts` - Does a pattern match a day (monthly last-day rule).
- `src/utils/metrics.ts` - Streak with working days; carry-over rates; M4; M5.
- `src/utils/reportBuilder.ts`, `src/utils/reportFormatters.ts` - Summary line.
- `src/services/closeout/closeoutService.ts` - Carry to the next working day.
- `src/services/reminders/reminderPlan.ts`, `src/hooks/useReminderTicks.ts` - Snoozed reminders.
- `src/services/voice/voiceAlerts.ts` - Respect quiet hours.
- `src/services/backup/backupSnapshot.ts`, `src/schemas/backupFile.ts` - Backup format v2 that still reads v1.
- `src/schemas/taskForm.ts`, `src/utils/taskFormMapping.ts` - Repeat fields.
- `src/components/ui/toggle-group.tsx` - shadcn ToggleGroup ([REUSE], added with the CLI).
- `src/components/common/WeekdayPicker.tsx`, `src/components/common/TimeRangeField.tsx`, `src/components/common/NoticeBanner.tsx` - New shared components.
- `src/components/canvas/BlockTimeLeft.tsx` - Countdown in the block header and mobile tab strip.
- `src/components/canvas/CanvasNotices.tsx` - Nudge and budget banners, at most two at once.
- `src/components/task/RepeatField.tsx`, `src/components/task/EditRepeatingDialog.tsx` (D8), `src/components/task/DeleteTaskDialog.tsx` (repeating variant), `src/components/task/StickyNote.tsx` (markers), `src/components/task/TaskEditorForm.tsx` (overlap warning, Repeat).
- `src/components/settings/WorkdaySection.tsx` - S7h.
- `src/components/settings/StatsSection.tsx`, `src/components/settings/CarryoverInsights.tsx` - M4, M5, time in Taskuda, carry-over.
- `src/components/eyeBreaks/EyeBreakScheduler.tsx`, `src/components/screenTime/ScreenTimeTracker.tsx` - Mounted in the app shell like `ReminderScheduler`.
- Tests next to each file above, plus `e2e/tasks.spec.ts`, `e2e/settings.spec.ts`, `e2e/voice.spec.ts`, `e2e/closeout.spec.ts`, `e2e/report.spec.ts`, `e2e/backup.spec.ts`, `e2e/calendar.spec.ts`, new `e2e/recurring.spec.ts` and `e2e/workday.spec.ts`.

### Tasks (additions)

- [x] 13.0 Add undo for deleted tasks (FR18, DAC15)
  - [x] 13.1 Add `task_restored` to `ActivityEventType`
  - [x] 13.2 Make `deleteTask` return a snapshot of the deleted task; add `restoreTask(snapshot)` that puts it back with the same id, day, block and order, and appends `task_restored` (AC18.2, AC18.3)
  - [x] 13.3 On restore of a task that had a calendar event, clear its mapping/tombstone so the next sync creates exactly one new event (AC18.4). Also: the sync no longer re-links cancelled events by task id (impl notes 1.6)
  - [x] 13.4 In `useTaskActions`, change the delete toast to "Task deleted" with an Undo action for 10 s; Undo calls `restoreTask` and shows "Task restored"; announce "Task deleted. Undo available." through the live announcer (AC18.1, AC18.5)
  - [x] 13.5 Check that the toast timer pauses while focus or the pointer is inside it (design Section 7); fix if Sonner doesn't do this. Sonner only pauses on hover, so `UndoToast` has its own pausable timer
  - [x] 13.6 Tests: repository restore round trip and activity log (AC18.2, AC18.3; M1 needs nothing extra because it only reads tasks that exist); calendar sync after restore makes no duplicate (AC18.4); e2e delete → Undo with mouse and with keyboard (AC18.1, AC18.5, DAC15)

- [x] 14.0 Add configurable working days and the Workday settings section (FR19, S7h; carryover to the next working day, M2)
  - [x] 14.1 Create `types/workday.ts` and `services/workday/workdaySettings.ts` with working days (default Mon–Fri, at least one). Use a backed-up key (not `device.`)
  - [x] 14.2 Change `utils/dates.ts`: `isWorkingDay(dayKey, workingDays)` and `nextWorkingDay(dayKey, workingDays)`; update every caller; unit tests for Friday → Monday, Saturday as a working day, and a single working day
  - [x] 14.3 Pass working days into `closeoutStreak`; `useMetrics` reads the setting (AC19.2)
  - [x] 14.4 `finishCloseout` carries over to `nextWorkingDay` instead of the next calendar day (AC11.1, AC19.3); the done toast and the report's carried heading use the day name when it isn't tomorrow (design Section 8). The AI prompt now says "moving to the next working day"
  - [x] 14.5 Add shadcn ToggleGroup; build `WeekdayPicker` (full day names as labels, `aria-pressed`, can't untick the last day, short labels under 400px)
  - [x] 14.6 Add `WorkdaySection` at `/settings/workday`, second in the nav, with the Working days field; later tasks add the other fields
  - [x] 14.7 Tests: WeekdayPicker minimum rule; closeout carryover Friday → Monday; streak with custom days; e2e change working days in Settings and see the carryover follow (streak covered by unit tests); Workday added to the a11y sweep. Closeout tests pin a weekday (e2e clock) or set all days working (unit) so they pass on any day

- [x] 15.0 Add the report summary line and the time left in the current block (FR24, FR27, DAC20)
  - [x] 15.1 Add a `summary` (done, in progress, carried counts and company count) to `ReportData` for the all-companies scope only (AC24.3)
  - [x] 15.2 Render the summary line first in the Slack, Teams, Jira and Email formatters; leave out zero counts; "1 company" vs "3 companies" (AC24.1, AC24.2)
  - [x] 15.3 Add `blockTimeLeft(date)` to `utils/timeBlocks.ts` (`null` for Evening) and `spokenDuration` next to `formatDuration` for "1 h 20 min left"
  - [x] 15.4 Build `BlockTimeLeft` using `useNow` (ticks at least once a minute); show it in the current `TimeBlockColumn` header and under the mobile tab list, only on today; include it in the header's accessible name, not as a live region (AC27.1–AC27.3)
  - [x] 15.5 Tests: formatter tests for each format with and without zero counts; `blockTimeLeft` unit tests; component test with fake timers crossing 11:59 → 12:00 (DAC20); e2e report shows the line for all companies only. Also fixed: the closeout step area now scrolls, so a tall report no longer slides under the Back / Next footer on phones

- [x] 16.0 Add the closeout nudge, snooze / mark done from reminders, and quiet hours (FR21, FR22, FR23, DAC16, DAC18, DAC19)
  - [x] 16.1 Add closeout-reminder time (Off or a time, default 5:30 PM) and quiet hours (off, start, end) to Workday settings; build `TimeRangeField` ("Start and end can't be the same."); add both fields to `WorkdaySection`
  - [x] 16.2 `utils/quietHours.ts`: `isInQuietHours(now, range)` including overnight ranges; unit tests
  - [x] 16.3 `voiceAlert` doesn't speak during quiet hours; toasts still show (AC23.2)
  - [x] 16.4 Reminder toasts: actions Snooze 5 min, Snooze 15 min, Mark done; `duration: Infinity`; never take focus (AC22.1, AC22.4, DAC18). A custom `ReminderToast`, since Sonner toasts hold one action
  - [x] 16.5 Snooze: store snoozed-until per reminder id; `dueReminders` fires it again at that time with toast and voice; "Reminder snoozed until 2:15 PM." toast (AC22.2)
  - [x] 16.6 Mark done goes through the same path as the status toggle (activity log, cheer, Jira mapping) (AC22.3). The shared path is now `services/tasks/taskStatusActions.ts`
  - [x] 16.7 `services/workday/closeoutNudge.ts`: pure function that returns banner / toast / voice from now, settings, today's closeout, the dismissed day, and whether the app was open at nudge time (AC21.2–AC21.4)
  - [x] 16.8 Build `NoticeBanner`; show the nudge banner on S2 under the storage notice (the budget banner joins it in 18.0). "Close out day" opens today's closeout even when another day is shown; "Not today" saves the dismissed day (AC21.3, DAC19). Announced politely through the live announcer, not as `role="alert"`
  - [x] 16.9 Add `Alt+T` (focus newest action toast) to the shortcuts dialog and make sure Sonner's hotkey matches
  - [x] 16.10 Tests: nudge decision table; quiet hours; snooze timing with fake timers; e2e snooze and mark done from the toast (DAC16); nudge banner opens the closeout in one click (DAC19); typing in the editor while alerts fire keeps focus and text (DAC18). Also fixed: toasts now sit below the app bar (they covered the day navigator), and the a11y helper scans toasts separately, which ends the long-running closeout contrast flake

- [x] 17.0 Add overlap warnings and carry-over insights (FR25, FR26)
  - [x] 17.1 Move the 30-minute default duration into a shared constant in `utils/` so utils don't import services; `services/calendar/eventMapping.ts` uses it
  - [x] 17.2 `utils/overlaps.ts`: for a day's tasks, map each task to the tasks it overlaps (start + duration, default 30 min; done tasks ignored; calendar tasks included) (AC25.1, AC25.4)
  - [x] 17.3 `TaskCanvas` computes overlaps once per day; `StickyNote` shows the overlap marker (icon + text, "Overlaps with 2 tasks") and adds it to the note's `aria-label` (AC25.2)
  - [x] 17.4 `TaskEditorForm` shows the non-blocking overlap warning under Duration (AC25.3)
  - [x] 17.5 `utils/metrics.ts`: carry-over rate per company and overall for past days in the 28-day window; "needs attention" for ≥ 5 tasks and ≥ 30%; open tasks carried 3+ times (AC26.1–AC26.3). Built as `utils/carryoverInsights.ts`, reusing `windowStart` from metrics, to keep files single-purpose
  - [x] 17.6 Build `CarryoverInsights` in `StatsSection` with company names (never ids), percentages, callouts, the 3+ list, and the empty state (AC26.4)
  - [x] 17.7 Tests: overlap unit tests (touching ends don't overlap, no duration, done ignored); metric unit tests; component tests for marker labels and the editor warning; Stats component test. Also fixed: the close-out nudge e2e test polls for the spoken line (the banner and voice come from separate ticks)

- [x] 18.0 Add eye-break reminders and the in-app time budget, with M4 and M5 in Stats (FR28, FR29, DAC21)
  - [x] 18.1 Add eye-break settings (off by default; interval 20/30/45/60, default 20; hours default 9:00 AM–5:00 PM) and the daily budget (Off/1–4 h) to Workday settings and `WorkdaySection`
  - [x] 18.2 Add a new database version with an eye-break log table (time, outcome) and a daily in-app time table (day key → ms). Decide whether each is backed up (design notes) and record it in the implementation notes. Decided: neither is backed up (per-device, and minute-by-minute writes would keep marking the backup as changed); backup format stays v1 until 19.11
  - [x] 18.3 `services/eyeBreaks/eyeBreakPlan.ts`: pure function for the next prompt (interval since the last prompt, working days, eye-break hours, quiet hours), missed prompts on return, and replacing an open prompt as missed (AC28.2, AC28.4, AC28.5, AC23.3)
  - [x] 18.4 `EyeBreakScheduler` mounted in the app shell: toast with Done / Snooze 5 min, voice line, "(missed while you were away)", outcome logged (AC28.2, AC28.3). Built as one `WellbeingScheduler` (with 18.5), and `ActionToast` shared with reminder toasts
  - [x] 18.5 `screenTimeTracker.ts` + `ScreenTimeTracker`: count only visible time (`visibilitychange`), save at least once a minute and when hidden (AC29.1)
  - [x] 18.6 Budget warning: pure decision for the first warning and at most one per extra hour; toast + budget banner in `CanvasNotices`; Dismiss; nothing blocked (AC29.3)
  - [x] 18.7 M4 and M5 in `utils/metrics.ts`; two new MetricTiles with "Off" states linking to Workday; "Time in Taskuda today / 7-day average (on this device, not total screen time)" (AC17.2, AC29.4, AC29.5, DAC21)
  - [x] 18.8 Tests: eye-break plan decision table with fake timers; tracker counts only visible time; budget warning repeats once per extra hour; metric unit tests; Stats labels (DAC21); e2e eye-break Done and Snooze. Also: the nudge voice e2e waits up to 20 s (a reminder tick can be skipped under load)

- [ ] 19.0 Add recurring tasks, with a new database version and backup format v2 (FR20, F14, D8, DAC17)
  - [ ] 19.1 Decide how occurrences are stored (created when a today/future day is opened vs computed) and record it in the implementation notes. Recommended: create real tasks, one per series per day, so every existing task feature just works
  - [ ] 19.2 `types/recurring.ts`: RecurringSeries (title, notes, company, block, start time, duration, pattern, start day, ended-from day) and `Task.seriesId`; new database version with a `recurringSeries` table and a `[seriesId+dayKey]` index on tasks; existing tasks get `seriesId: null`
  - [ ] 19.3 `utils/recurrence.ts`: `matchesDay(pattern, dayKey, workingDays)` for every day, every working day, weekly on weekdays, monthly on a date (last day of shorter months) (AC20.1)
  - [ ] 19.4 `occurrenceService.ensureOccurrences(dayKey)`: never on past days; skip a series that already has a task on that day (including a carried copy); safe to run twice; called when today or a future day is shown (AC20.2–AC20.4)
  - [ ] 19.5 `carryOverTask` keeps `seriesId` on the copy (AC20.4)
  - [ ] 19.6 Edit and delete scopes: "This task only" changes only that task; "This and future tasks" updates the series from that day and the not-yet-touched future occurrences, or ends it; past days never change (AC20.5)
  - [ ] 19.7 `RepeatField` in `TaskEditorForm` (Repeat select, WeekdayPicker for Weekly with the day preselected, "On day" for Monthly with the 29–31 hint, "Pick at least one day."); Zod schema and form mapping (AC20.1, DAC17)
  - [ ] 19.8 D8 `EditRepeatingDialog` and the repeating variant of D1; undoing a series delete also restores the series (FR18)
  - [ ] 19.9 `StickyNote` repeats marker and `aria-label` text, never the raw pattern value (AC20.2)
  - [ ] 19.10 Calendar sync: each occurrence with a start time is its own event; repeated sync makes no duplicates (AC20.6)
  - [ ] 19.11 Backup format v2: include series (and any 18.2 tables marked backed up); `backupFile` schema accepts versions 1 and 2; restoring and importing a v1 file still works (AC20.7, RK16)
  - [ ] 19.12 Tests: `matchesDay` table (Feb 28/29, 31st, working days); occurrence service (past day, carried copy, run twice); scope edits; carryover keeps the series; backup v1 and v2 restore; calendar no-duplicates; e2e `recurring.spec.ts` for F14 (DAC17)

- [ ] 20.0 Final pass for the additions: accessibility, responsive checks, docs, implementation notes, all checks green, commit
  - [ ] 20.1 `a11y.spec.ts`: add S7h, D8, the D1 repeating variant, action toasts, and both banners (DAC10)
  - [ ] 20.2 `responsive.spec.ts`: S7h, banners, Repeat field and Stats at 320px, 768px and 1280px with no horizontal scrolling (DAC8)
  - [ ] 20.3 User-relevance review of the new UI: no raw ids, enum values (`working_days`), milliseconds or ISO times shown
  - [ ] 20.4 `npm audit` after adding ToggleGroup; resolve critical/high issues
  - [ ] 20.5 Update `docs/engineering/taskuda-impl-notes.md`: new tables and versions, backup v2, the decisions from 18.2 and 19.1, the test mapping for AC17.2–AC29.5 and DAC15–DAC21, Definition of Done re-check
  - [ ] 20.6 Update `README.md` (Workday settings) and `CHANGELOG.md`
  - [ ] 20.7 Lint, typecheck, unit tests, e2e and build all pass; commit
