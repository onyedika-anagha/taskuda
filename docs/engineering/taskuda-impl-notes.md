# Taskuda — Implementation Notes

**Track:** A
**Upstream:** [PRD](../pm/taskuda-prd.md) (DoR passed, waiver W1) · [Design spec](../design/taskuda-design-spec.md) (DoR passed)
**Branch:** `feature/taskuda-v1`; FR30–FR34 on `feature/risk-and-onboarding`
**Status:** Definition of Done — passed with waivers E1–E4 (Section 7)
**Last updated:** 2026-10-21

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
| `tasks` | `id` (`[seriesId+dayKey]`) | Yes | Task (title, notes, companyId, dayKey, block, order, startTime, duration, status, carryover links, source, jiraIssue, seriesId, dueDate, dueTime) |
| `companies` | `id` | Yes | name, colorId |
| `closeouts` | `dayKey` | Yes | started/finished/report-copied times, rating, reflection, outcomes |
| `activityLog` | `++id` | Yes | created / updated / status / moved / carried / deleted events (metric M1) |
| `settings` | `key` | Yes, except `device.*`, `drive.*`, `google.*` | app settings, closeout drafts, AI provider/model, Jira site + status map |
| `calendarMappings` | `taskId` (`&eventId`) | Yes | task↔event links, sync times, tombstones |
| `vault` | `'vault'` | Yes | PBKDF2 params, passphrase-wrapped data key, key check, encrypted secrets |
| `deviceKeys` | `'device'` | **Never** | non-extractable AES key + device-wrapped data key |
| `recurringSeries` | `id` | Yes (backup format v2) | repeating task template, pattern, start day, ended-from day, skipped days |
| `eyeBreakLog` | `++id` (`dayKey`) | **No** (this device only) | eye-break prompt outcomes: done / snoozed / dismissed / missed (metric M4) |
| `screenTime` | `dayKey` | **No** (this device only) | ms Taskuda was visible that day (metric M5, time in Taskuda) |

Schema versions: **v1** (first six tables), **v2** (adds `vault`, `deviceKeys`), **v3** (adds `eyeBreakLog`, `screenTime`) **v4** (adds `recurringSeries`, the `[seriesId+dayKey]` index, and `seriesId: null` on every existing task) and **v5** (FR30: `dueDate: null, dueTime: null` on every existing task; no new index). All are additive.

**Onboarding state (FR33–FR34)** is not in IndexedDB. It's three per-device `localStorage` keys, never backed up: `taskuda.welcomeDone` (setup finished; the key predates the intro), `taskuda.setupStep` (the step setup was left on) and `taskuda.introSeen`.

**Migration reversibility:** IndexedDB/Dexie can't be downgraded in place; a lower version number throws `VersionError`. Rollback path: export a backup file (Settings → Backup), deploy the older build, clear site data, then import. The backup format is versioned and validated with Zod. Version 2 (written since FR20) adds `recurringSeries`. Version 1 files still restore and import: their tasks get `seriesId: null` and there are no series (tested, RK16). Version 3 (FR30) adds `dueDate`/`dueTime` on tasks; version 1 and 2 files restore with both `null` (tested, RK20).

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
| Due dates | FR30 | `utils/dueDates.ts`, `components/task/DueDateField.tsx`, `hooks/useDueDateField.ts`, `schemas/taskForm.ts`, `services/db/taskRepository.ts` |
| At-risk markers | FR31 | `utils/taskRisk.ts` (rules), `utils/riskLabels.ts`, `utils/riskMarkerColors.ts`, `hooks/useRiskClock.ts`, `hooks/useTaskRisks.ts`, `components/task/RiskMarker.tsx` |
| Day progress, at-risk list, M6 | FR32, AC17.3 | `components/canvas/DaySummaryRow.tsx`, `DayProgress.tsx`, `AtRiskButton.tsx`, `AtRiskDialog.tsx`; `deadlinesMet` in `utils/metrics.ts` |
| Intro and setup | FR33, FR34 | `services/onboarding/onboardingProgress.ts`, `hooks/useFirstRun.ts`, `hooks/useWelcomeFlow.ts`, `hooks/useIntroCarousel.ts`, `hooks/useSetupCompanies.ts`, `hooks/useSetupWorkday.ts`, `components/welcome/*`, `pages/WelcomePage.tsx`, `pages/IntroPage.tsx` |

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
- **Undo delete (FR18, added 2026-10-20):**
  - `deleteTask` returns a snapshot, and `restoreTask` puts the task back with the same id and position, logging `task_restored`.
  - If the calendar sync hasn't run yet, the tombstone is cleared and the event is kept. If it has, the task is pushed as a new event; a calendar-sourced task becomes `source: 'manual'` for that, because unlinked calendar tasks are never pushed.
  - **Calendar sync change:** a cancelled event is only acted on through an existing link. It is no longer re-linked by its Taskuda task id, which would have let the old event of an undone delete remove the restored task again.
  - The undo toast runs its own pausable timer (`UndoToast`, `usePausableTimeout`), because Sonner pauses on hover but not on keyboard focus.
- **Working days (FR19, added 2026-10-20):**
  - Stored in the backed-up setting `workday.workingDays` as date-fns weekday numbers (0 = Sunday), Monday-first. An empty or unreadable value falls back to Mon–Fri.
  - `nextWorkingDay` drives carryover, and `ReportData.carriedToDayKey` drives the "Carried to Monday" heading.
  - **WeekdayPicker names:** each button's name comes from its text, with the letters past "M"/"Mon" kept inline at zero font size inside one wrapper span. Two simpler options failed:
    - `aria-label="Monday"` with "Mon" shown fails axe `label-content-name-mismatch`.
    - `sr-only` spans, or separate flex items, give "Mon day".
  - The group is a `fieldset` with a screen-reader-only `legend`.
- **Report summary and time left (FR24, FR27, added 2026-10-20):**
  - **Summary:** `ReportData.summary` is set for the all-companies scope only. The line follows the title in all four formats. Tasks without a company don't count as a company.
  - **Time left:** rounded up to whole minutes, so the last seconds read "1 min left". It ticks every 15 s.
  - **Screen readers:** they get "1 hour 20 minutes left" inside the block heading. On phones the heading is hidden, and an `aria-hidden` line under the tabs shows the time.
  - **Closeout layout fix:** the step content area scrolls on its own (`overflow-y-auto`). Before, tall content (the report with its new summary line) overflowed behind the Back / Next footer on phones, which blocked "Copy report".
- **Nudge, snooze and quiet hours (FR21–FR23, added 2026-10-20):**
  - **Settings:** `workday.closeoutReminder` (`HH:mm` or `null`, default 17:30) and `workday.quietHours` (`{ enabled, start, end }`, off by default, 22:00–07:00). Both are backed up. A quiet-hours range with start = end is rejected.
  - **Voice:** `speakAlert` and `voiceAlert` speak only when voice is on and it isn't quiet hours. The cheer follows the same rule.
  - **Reminder toasts:** `ReminderToast` is a custom Sonner toast, because Sonner toasts hold only one action. There's one toast per task (`reminder:<taskId>`), so "Starting now" replaces "Up next", and it stays until the user acts.
  - **Snoozes:** kept in `localStorage` per day next to the handled list, so a pending snooze **survives a reload** (design note resolved). A snooze due while hidden goes to the catch-up list, and one whose task is done is dropped.
  - **Mark done:** `changeTaskStatus` (moved out of `useTaskActions` into `services/tasks/taskStatusActions.ts`) is the one status path for the note and the reminder.
  - **Nudge:** `closeoutNudge.ts` holds pure decisions. `checkCloseoutNudge` runs with each reminder tick and alerts once a day, only when visible within 2 minutes of the nudge time. `useCloseoutNudge` drives the banner. The dismissed day and the alerted day are per-device `localStorage` values.
  - **NoticeBanner** is its own markup with no live role (shadcn `Alert` forces `role="alert"`, which interrupts). The nudge is announced once through the polite live announcer.
- **Toasts below the app bar (2026-10-20):** the top-center toasts covered the day navigator for about 4 s after every action. The Toaster now has a top offset of `calc(env(safe-area-inset-top) + 60px)`.
- **a11y test helper:** page scans wait two frames, then for running animations and unsettled Sonner toasts, and they leave the toaster out. `expectNoToastA11yViolations` scans toasts on their own (a11y spec, both themes). This was the cause of the long-running "closeout contrast" e2e flake: a toast fading in or out mid-scan, and a scan that started before the lazy closeout dialog had faded in.
- **Overlaps and carry-over insights (FR25, FR26, added 2026-10-20):**
  - **Default duration:** `DEFAULT_TASK_MINUTES` (30) lives in `utils/taskDuration.ts`. The calendar mapping and the overlap check both use it, so a task without a duration is the same length on the canvas and in the calendar.
  - **Overlap rule:** `utils/overlaps.ts` treats ranges as half-open, so 2:00–2:30 and 2:30–3:00 don't overlap. Done tasks and tasks without a start time never overlap. `TaskCanvas` computes the map once per render of the day, and the editor checks the unsaved start time and duration live (`useDraftOverlaps`).
  - **Several overlaps in the editor:** the design spec only gives copy for one task. With more than one, the warning lists them: "Overlaps with 2 tasks: Client call (2:00–2:30 PM), Standup (2:15–2:45 PM). You can still save." The warning is linked to the Duration field with `aria-describedby`.
  - **Carry-over logic** lives in `utils/carryoverInsights.ts`, not `utils/metrics.ts` (the task list named metrics.ts), to keep each file to one job. It reuses `windowStart`. "Needs attention" only names real companies. Tasks without a company show as "No company" in the rates but are never called out. The 3+ list shows only the latest open copy (`carriedToTaskId === null`), read from the window start onward.
  - **Stats layout:** Carry-over shows even before the first closeout, since it has its own empty state.
- **Voice e2e race fixed (2026-10-20):** the nudge banner and the spoken nudge come from separate ticks, so the test now polls for the spoken line instead of reading it once. On 2026-10-21 the wait went up to 20 s: a tick is skipped while the previous one still runs, so under load the next one is a full tick (15 s) later.
- **Eye breaks and the time budget (FR28, FR29, added 2026-10-21):**
  - **Backup decision (task 18.2):** `eyeBreakLog` and `screenTime` stay on this device and are **not** in backups, and backup format version 2 (FR20) leaves them out too. Reasons: in-app time is per device by definition (AC29.5). Both tables change every minute or so, and `trackBackedUpChanges` would mark the backup as changed each time, which would keep Drive syncing. The cost: M4 and M5 start over on a new device or after a restore. Their settings (`workday.eyeBreaks`, `workday.dailyBudgetHours`) *are* backed up.
  - **Interval anchor:** the next prompt is one interval after the latest of the last prompt, the start of today's eye-break hours, and when this tab opened Taskuda. Prompts only count time while Taskuda is open (AC28.2), so opening it mid-morning doesn't fire one straight away. A reload restarts the interval. The last-prompt time and a pending snooze are kept in `localStorage`, like reminder snoozes.
  - **Outcomes:** Done, Close (dismissed) and Snooze (snoozed) are logged from the toast. A prompt that came due in the background is logged as missed when it shows on return, and its buttons don't log it again. A prompt replaced by the next one is logged as missed (F15.5). Prompts skipped during quiet hours aren't logged (AC23.3), and missed prompts aren't spoken.
  - **M4** = Done ÷ (Done + dismissed + missed) over the window. A snooze isn't an ending: the prompt comes back and gets its own outcome. Without this, snooze-then-Done would count as 50%.
  - **M5** = past working days in the window that have time recorded and stayed at or under the budget, as a share of those days. Today doesn't count until it's over, and days Taskuda wasn't opened are left out.
  - **7-day average** = total over the 7 full days before today ÷ 7. Days Taskuda wasn't opened count as 0.
  - **Tracker:** `createScreenTimeTracker` counts only visible time (`visibilitychange`). It saves every 30 s while visible, and on hide and `pagehide`, splitting a session that crosses midnight. Storage errors are ignored.
  - **Budget warning:** the level is the whole hours spent once at or over the budget, so it warns at 2 h, then 3 h, then 4 h (AC29.3). The warned and dismissed levels are per-device, per-day `localStorage` marks. The banner shows the current level until it's dismissed and comes back at the next level.
  - **Banners:** `CanvasBanners` shows the nudge, then the budget banner. The budget banner waits while the offline notice and the nudge already show (at most two).
  - **Structure:** one `WellbeingScheduler` (eye-break ticks + screen-time tracking) is mounted next to `ReminderScheduler`, rather than separate `EyeBreakScheduler` and `ScreenTimeTracker` components. `ActionToast` is the shared shell of the reminder and eye-break toasts.
- **Recurring tasks (FR20, added 2026-10-21):**
  - **Storage decision (task 19.1):** occurrences are real tasks, created when today or a future day is shown (`useTasksForDay`) and on each reminder tick for today. The alternative, computing them from the series on the fly, was rejected: every task feature (status, move, carryover, reminders, calendar, reports, M1) would need a second code path. A day never opened has no occurrence, so nothing counts as dropped (AC20.3).
  - **One per series per day:** `ensureOccurrences` skips a day that already has a task with the series' id, in one read-write transaction, so running it twice (or in two tabs) creates one. A carried copy keeps `seriesId`, so it stands in for that day's occurrence (AC20.4). If the occurrence already exists when a task is carried onto that day, `carryOverTask` links to it instead of copying (the original's `carriedToTaskId` points at the occurrence, whose carried-over count goes up), so a day never shows two.
  - **"This task only" delete** adds the day to the series' `skippedDayKeys`, so the occurrence isn't created again.
  - **"This and future tasks" edit:** the old series ends at this task's day, and a new series with the changes starts there. Later occurrences the user hasn't touched (still To Do, never edited or carried) are deleted and come back from the new series when their day is shown. Touched ones keep their changes and join the new series, or leave the series if the new pattern doesn't fall on their day. Days before this task never change.
  - **"This and future tasks" delete** ends the series at this day and deletes this and every later task of the series. Undo restores the series as it was and every deleted task.
  - **D8 is skipped when Repeat changes:** a different Repeat choice can only apply from this task on, so it saves as "This and future tasks" without asking. D8 is also skipped when nothing changed. Changing Repeat to "Doesn't repeat" stops the series from this day.
  - **Calendar (AC20.6):** occurrences are normal timed tasks, so each gets its own event through the existing task↔event mapping, and repeated syncs add no duplicates (tested).
  - **Repeats marker:** shown while the series still runs on the task's day ("Repeats daily", "Repeats on working days", "Repeats weekly", "Repeats monthly"), and part of the note's `aria-label`.
  - **Editor bug found by e2e:** `useLiveQuery` keeps returning the previous query's result after its dependencies change. The editor briefly saw "no series" for a repeating task, so the form started at "Doesn't repeat", and saving stopped the series. `useSeries` now tags its result with the id it was read for (unit test added).
  - **Default block:** `openCreate` now picks the block for the current time when the editor opens, instead of the editor calling `new Date()` during render (lint purity rule).
- **AI model field flake was a real bug (2026-10-21):** the field was keyed on the stored model, so a save that landed after the user had started editing again remounted it and dropped the edit. It also skipped a save when the new value matched a stale `value` prop. The field now keeps the value it last saved, adopts only changes made elsewhere (a restore), and is keyed on the provider only (`AiModelField.test.tsx`). The other intermittent failures seen this cycle were test timing (the reminder-tick waits in `voice.spec.ts`, and the budget toast matched in `BudgetBanner.test.tsx`), and were fixed in the tests.
- **Past days that were never closed out can still be closed out.**
- **Voice lines say "2:00 PM".**
- **First-run Drive connect** checks for an existing backup before uploading a new one.
- **Performance (NFR3):**
  - Settings, Report, Welcome and the closeout dialog load on demand.
  - Libraries are split into `react`, `ui` and `data` chunks.
  - First load is about 270 KB gzip of JavaScript; the app's own chunk is 46 KB.
- **Focus outline:** a solid 2px outline is used everywhere, with contrast between 6.9:1 and 9.4:1.

**FR30–FR34 (2026-10-21).** The design spec's open engineering questions, decided:
- **Due date storage:** a local `dueDate` (`yyyy-MM-dd`) and an optional `dueTime` (`HH:mm`), matching `dayKey`/`startTime`. With no time, the due moment is the end of that day. The repository rejects a time without a date.
- **Risk rules:** one pure function, `taskRisk(task, now)` in `utils/taskRisk.ts`, used by the canvas, D9 and the closeout. Start and end times are on the task's own day, the same as reminders, so a 01:00 Evening task is 01:00 on its `dayKey`. `useRiskClock` re-renders every minute and on `visibilitychange`; one `useTaskRisks` call in `TodayPage` feeds both the notes and the summary row, so they never disagree.
- **Setup resume (AC34.5):** `useFirstRun` used to treat "has a company" as finished. It now checks `taskuda.setupStep` first. `useWelcomeFlow` saves the step in an effect from the first setup step on, so a company added before a closed tab can't skip the rest. Devices with data and no saved step still count as finished (PRD Out of Scope 29).
- **M6 timestamp:** the latest `task_status_changed` to Done in the activity log (falling back to `updatedAt`), compared with the due moment. Only the latest copy of a carried task counts, so carrying a task over doesn't count as two misses.
- **Repeating tasks and due dates:** turning Repeat on hides the due date and `formToPatch` drops it, rather than clearing it in an effect. Series never store due fields: `changeSeriesFrom` strips them from the patch.
- **Marker colors:** the marker has its own hex palette (`riskMarkerColors.ts`) on a near-opaque background, so DAC28 is a plain contrast test rather than 10 tints × 2 themes × 2 styles.
- **D9** reuses `ResponsiveDialog`, so it is 560px wide on tablet and up, not the 480px in the design spec. Not worth a size option on the shared component.
- **Accessible names (WCAG 2.5.3):** the e2e axe run flagged the At-risk button and the D9 rows, whose spoken names didn't contain their visible text. The button is now named "At risk · 2, show 2 tasks", and each D9 row's name is its visible text. Design spec updated.

---

## 2. Test Plan & Coverage

- **Totals:** 82 unit/component test files and 16 Playwright specs.
  - Final run (2026-10-21, after FR30–FR34): 775 unit/component tests and 179 Playwright tests passing across desktop, tablet and phone sizes, with 4 skipped as screen-size specific.
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
| AC17.2 | `components/settings/StatsSection.test.tsx` |
| AC18.1 | `components/common/UndoToast.test.tsx`, `e2e/tasks.spec.ts`, `pages/TodayPage.test.tsx` |
| AC18.2 | `services/db/taskRepository.test.ts` |
| AC18.3 | `services/db/taskRepository.test.ts` |
| AC18.4 | `services/calendar/calendarSync.test.ts`, `services/db/taskRepository.test.ts` |
| AC18.5 | `components/common/UndoToast.test.tsx`, `e2e/tasks.spec.ts` |
| AC19.1 | `components/common/WeekdayPicker.test.tsx`, `e2e/workday.spec.ts`, `services/workday/workdaySettings.test.ts`, `utils/dates.test.ts` |
| AC19.2 | `utils/metrics.test.ts` |
| AC19.3 | `e2e/workday.spec.ts`, `services/closeout/closeoutService.test.ts`, `utils/dates.test.ts` |
| AC19.4 | `services/eyeBreaks/eyeBreakPlan.test.ts`, `services/workday/closeoutNudge.test.ts`, `utils/recurrence.test.ts` |
| AC20.1 | `components/task/TaskEditorForm.test.tsx`, `utils/recurrence.test.ts`, `utils/taskFormMapping.test.ts` |
| AC20.2 | `components/task/StickyNote.test.tsx`, `services/db/seriesRepository.test.ts` |
| AC20.3 | `services/db/seriesRepository.test.ts` |
| AC20.4 | `services/db/seriesRepository.test.ts` |
| AC20.5 | `e2e/recurring.spec.ts`, `services/db/seriesRepository.test.ts` |
| AC20.6 | `services/calendar/calendarSync.test.ts` |
| AC20.7 | `services/backup/backupSnapshot.test.ts` |
| AC21.1 | `components/canvas/CloseoutNudgeBanner.test.tsx`, `e2e/workday.spec.ts`, `services/workday/closeoutNudge.test.ts`, `services/workday/workdaySettings.test.ts` |
| AC21.2 | `components/canvas/CloseoutNudgeBanner.test.tsx`, `e2e/voice.spec.ts`, `hooks/useReminderTicks.test.tsx`, `services/workday/closeoutNudge.test.ts` |
| AC21.3 | `components/canvas/CloseoutNudgeBanner.test.tsx`, `hooks/useReminderTicks.test.tsx`, `services/workday/closeoutNudge.test.ts` |
| AC21.4 | `hooks/useReminderTicks.test.tsx`, `services/workday/closeoutNudge.test.ts` |
| AC22.1 | `hooks/useReminderTicks.test.tsx` |
| AC22.2 | `e2e/voice.spec.ts`, `hooks/useReminderTicks.test.tsx` |
| AC22.3 | `e2e/voice.spec.ts`, `hooks/useReminderTicks.test.tsx` |
| AC22.4 | `hooks/useReminderTicks.test.tsx` |
| AC23.1 | `components/common/TimeRangeField.test.tsx`, `e2e/workday.spec.ts`, `services/workday/workdaySettings.test.ts`, `utils/quietHours.test.ts` |
| AC23.2 | `hooks/useReminderTicks.test.tsx` |
| AC23.3 | `services/eyeBreaks/eyeBreakAlerts.test.ts`, `services/eyeBreaks/eyeBreakPlan.test.ts` |
| AC24.1 | `e2e/report.spec.ts`, `utils/reportFormatters.test.ts` |
| AC24.2 | `utils/reportFormatters.test.ts` |
| AC24.3 | `e2e/report.spec.ts`, `utils/reportFormatters.test.ts` |
| AC25.1 | `utils/overlaps.test.ts` |
| AC25.2 | `components/task/StickyNote.test.tsx` |
| AC25.3 | `components/task/TaskEditorForm.test.tsx` |
| AC25.4 | `utils/overlaps.test.ts` |
| AC26.1 | `components/settings/StatsSection.test.tsx`, `utils/carryoverInsights.test.ts` |
| AC26.2 | `utils/carryoverInsights.test.ts` |
| AC26.3 | `components/settings/StatsSection.test.tsx`, `utils/carryoverInsights.test.ts` |
| AC26.4 | `components/settings/StatsSection.test.tsx`, `utils/carryoverInsights.test.ts` |
| AC27.1 | `components/canvas/BlockTimeLeft.test.tsx`, `utils/timeBlocks.test.ts` |
| AC27.2 | `components/canvas/BlockTimeLeft.test.tsx`, `utils/timeBlocks.test.ts` |
| AC27.3 | `components/canvas/BlockTimeLeft.test.tsx` |
| AC28.1 | `services/eyeBreaks/eyeBreakPlan.test.ts`, `services/workday/workdaySettings.test.ts` |
| AC28.2 | `e2e/voice.spec.ts`, `services/eyeBreaks/eyeBreakAlerts.test.ts`, `services/eyeBreaks/eyeBreakPlan.test.ts` |
| AC28.3 | `e2e/voice.spec.ts`, `services/eyeBreaks/eyeBreakAlerts.test.ts` |
| AC28.4 | `services/eyeBreaks/eyeBreakAlerts.test.ts`, `services/eyeBreaks/eyeBreakPlan.test.ts` |
| AC28.5 | `services/eyeBreaks/eyeBreakAlerts.test.ts`, `services/eyeBreaks/eyeBreakPlan.test.ts` |
| AC29.1 | `services/screenTime/screenTimeTracker.test.ts` |
| AC29.2 | `services/workday/workdaySettings.test.ts` |
| AC29.3 | `components/canvas/BudgetBanner.test.tsx`, `services/screenTime/budgetAlerts.test.ts`, `services/screenTime/budgetWarning.test.ts` |
| AC29.4 | `components/settings/StatsSection.test.tsx`, `utils/metrics.test.ts` |
| AC29.5 | `components/settings/StatsSection.test.tsx` |
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
| DAC8, DAC10 | `e2e/a11y.spec.ts` (every screen, 3 sizes, light + dark; a separate test covers the FR18–FR29 additions: S7h expanded, the Repeat field, D8, the D1 repeating variant, reminder and eye-break toasts, both banners, and Stats with all five tiles) |
| DAC9 | `e2e/a11y.spec.ts` (Tab order), `e2e/tasks.spec.ts` (keyboard reorder) |
| DAC11 | `utils/companyPalette.test.ts` |
| DAC12 | `hooks/useReminderTicks.test.tsx`, `components/settings/VoiceSection.test.tsx`, `e2e/voice.spec.ts` |
| DAC13 | `components/closeout/CloseoutDialog.test.tsx`, `e2e/closeout.spec.ts` (survives reload) |
| DAC14 | `components/security/SecretField.test.tsx` |
| DAC15 | `e2e/tasks.spec.ts` |
| DAC16 | `e2e/voice.spec.ts`, `hooks/useReminderTicks.test.tsx` |
| DAC17 | `components/task/TaskEditorForm.test.tsx`, `e2e/recurring.spec.ts` |
| DAC18 | `e2e/voice.spec.ts`, `hooks/useReminderTicks.test.tsx` |
| DAC19 | `components/canvas/CloseoutNudgeBanner.test.tsx`, `e2e/voice.spec.ts` |
| DAC20 | `components/canvas/BlockTimeLeft.test.tsx` |
| DAC21 | `components/settings/StatsSection.test.tsx` |
| AC17.3 (M6) | `utils/metrics.test.ts`, `components/settings/StatsSection.test.tsx` |
| AC18.2 (due date) | `services/db/taskRepository.test.ts` |
| AC30.1 | `services/db/taskRepository.test.ts`, `utils/dueDates.test.ts`, `components/task/TaskEditorForm.test.tsx` |
| AC30.2 | `utils/dueDates.test.ts`, `components/task/StickyNote.test.tsx`, `e2e/risk.spec.ts` |
| AC30.3 | `components/task/TaskEditorForm.test.tsx`, `e2e/a11y.spec.ts` |
| AC30.4 | `services/db/taskRepository.test.ts`, `utils/taskFormMapping.test.ts`, `components/task/TaskEditorForm.test.tsx` |
| AC30.5 | `services/db/taskRepository.test.ts` (carryover, undo), `utils/taskFormMapping.test.ts`, `components/task/TaskEditorForm.test.tsx` |
| AC30.6 | `services/backup/backupSnapshot.test.ts` (v2 and v3), `components/settings/BackupSection.test.tsx`, `e2e/backup.spec.ts` |
| AC31.1–AC31.3 | `utils/taskRisk.test.ts` |
| AC31.4 | `components/task/StickyNote.test.tsx`, `utils/riskLabels.test.ts` |
| AC31.5 | `components/closeout/CloseoutDialog.test.tsx` |
| AC31.6 | `hooks/useTaskRisks.test.tsx`, `components/canvas/RiskMarkers.test.tsx`, `e2e/risk.spec.ts` |
| AC31.7 | `components/canvas/RiskMarkers.test.tsx` |
| AC32.1, AC32.2 | `components/canvas/DaySummaryRow.test.tsx`, `e2e/risk.spec.ts` |
| AC32.3 | `utils/taskRisk.test.ts` (`atRiskTasks`), `components/canvas/DaySummaryRow.test.tsx` |
| AC32.4 | `components/canvas/DaySummaryRow.test.tsx`, `e2e/a11y.spec.ts` |
| AC33.1, AC33.3, AC33.4 | `pages/WelcomePage.test.tsx`, `components/welcome/IntroCarousel.test.tsx`, `e2e/welcome.spec.ts` |
| AC33.2 | `components/welcome/IntroCarousel.test.tsx` |
| AC33.5 | `e2e/offline.spec.ts` |
| AC34.1–AC34.6 | `pages/WelcomePage.test.tsx`, `services/onboarding/onboardingProgress.test.ts`, `utils/companyPalette.test.ts`, `e2e/welcome.spec.ts` |
| DAC22 | `components/task/TaskEditorForm.test.tsx`, `e2e/risk.spec.ts` |
| DAC23 | `hooks/useTaskRisks.test.tsx`, `components/canvas/RiskMarkers.test.tsx`, `e2e/risk.spec.ts` |
| DAC24 | `utils/taskRisk.test.ts` (every combination) |
| DAC25 | `components/canvas/DaySummaryRow.test.tsx`, `e2e/risk.spec.ts` |
| DAC26 | `components/welcome/IntroCarousel.test.tsx`, `e2e/welcome.spec.ts` |
| DAC27 | `pages/WelcomePage.test.tsx`, `e2e/welcome.spec.ts` |
| DAC28 | `utils/riskMarkerColors.test.ts` |
| DAC29 | `e2e/a11y.spec.ts` (both themes, three sizes), `e2e/risk.spec.ts` |

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
- **Bugs caught and fixed during FR30–FR34:**
  - Editing a repeating task "and future" would have copied `dueDate`/`dueTime: null` into the series record.
  - A company added in setup before the step was saved would have skipped the rest of setup on the next open.
  - The At-risk button and D9 rows failed WCAG 2.5.3 (label in name), caught by axe in Playwright.
  - Tests that depended on the time of day: after 5:30 PM the closeout nudge adds a second "Close out day" button (`CloseoutDialog.test.tsx`, `e2e/secrets.spec.ts`), and after 10 AM the calendar spec's 9:30 event is now correctly marked Overran (`e2e/calendar.spec.ts`).
  - On a 320px phone the new summary row moves the block tabs under the toast area. With the page clock frozen, a dismissed toast stayed over the open tab, so `blockArea` in `e2e/helpers.ts` no longer clicks a tab that's already selected.

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
- FR18–FR29 (2026-10-21): README (Workday settings, repeating tasks, what stays on this device), CHANGELOG 0.2.0, data model and backup format above, and the test mapping in Section 2.1.
- FR30–FR34 (2026-10-21): README (due dates, at-risk markers, first run), CHANGELOG (Unreleased), data model, onboarding keys and backup format above, decisions in Section 1.6, test mapping in Section 2.1. Design spec: the at-risk button's accessible name, D9 width and the workday save-error copy are marked "changed during build".

---

## 6. Definition of Done

Re-checked on 2026-10-21 after FR30–FR34: each new criterion maps to a test in Section 2.1. Lint, typecheck, build, 775 unit/component tests and 179 Playwright tests pass. A secrets search over the diff found nothing. No new endpoints or network calls: due dates, risk and onboarding are all local. Schema v5 and backup format v3 are additive (Section 1.2). No new `TODO`/`FIXME`, and no dependencies added or changed.

Re-checked on 2026-10-21 after FR18–FR29. Every box still holds: each new criterion maps to a test in Section 2.1, and the full suite, lint, typecheck and build pass. A secrets search over the new files found nothing, and there are no new endpoints (all new data is local). Schema v3 and v4 are additive (Section 1.2), with no new `TODO`/`FIXME`.

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
- **FR18–FR29 cycle (re-checked 2026-10-21):** no dependencies were added or changed (`package.json` is unchanged since FR18 was adopted). `npm audit --omit=dev`: 0 vulnerabilities. The dev-only findings are the same `braces` chain under waiver E3.

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
