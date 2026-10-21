# Tasks — At-risk signals and onboarding (PRD FR30–FR34)

Source: [docs/pm/taskuda-prd.md](../docs/pm/taskuda-prd.md) (FR30–FR34, M6, RK18–RK22) and [docs/design/taskuda-design-spec.md](../docs/design/taskuda-design-spec.md) (F1, F18–F20, S1a, S1b, D9, DAC22–DAC29).

Build order follows PRD Section 7: FR30 → FR31 → FR32 → FR34 → FR33.

## Relevant Files

### Data and rules
- `src/types/task.ts` - Add `dueDate` (`yyyy-MM-dd` | null) and `dueTime` (`HH:mm` | null) to `Task`, `NewTaskInput` and `TaskPatch`.
- `src/types/risk.ts` - New. `RiskKind` (`overdue` | `overran` | `running_late` | `due_today` | `stuck`) and `TaskRisk`.
- `src/services/db/database.ts` - Database version 5: fill `dueDate`/`dueTime` with `null` on existing tasks.
- `src/services/db/taskRepository.ts` - Save the due fields; `carryOverTask` and `restoreTask` keep them.
- `src/services/db/taskRepository.test.ts` - Carryover and undo keep the due date (AC30.5).
- `src/schemas/backupFile.ts` - Backup format version 3 (due fields); versions 1 and 2 still parse.
- `src/services/backup/backupSnapshot.ts` - Write version 3, and read versions 1–3 with no due date on older tasks.
- `src/services/backup/backupSnapshot.test.ts` - Restore and import of version 1, 2 and 3 files (AC30.6, RK20).
- `src/utils/dueDates.ts` - New. Due moment (no time means 23:59), "has passed", short and spoken due labels.
- `src/utils/dueDates.test.ts` - Unit tests for `dueDates.ts`.
- `src/utils/taskRisk.ts` - New. Pure `taskRisk(task, now, todayKey)` applying the AC31.1 rules and the AC31.2 priority; `atRiskTasks()` sorted for D9.
- `src/utils/taskRisk.test.ts` - Every rule, the priority order across all combinations (DAC24), and the midnight, Evening-block and grace-time boundaries (RK19).
- `src/utils/riskLabels.ts` - New. Visible and spoken marker text (design Section 8).
- `src/utils/riskLabels.test.ts` - Unit tests for `riskLabels.ts`.
- `src/utils/taskPresentation.ts` - Add the risk marker and due text to `taskAriaLabel`.
- `src/utils/taskPresentation.test.ts` - Tests for the new label parts.
- `src/utils/metrics.ts` - Add `deadlinesMet()` for M6.
- `src/utils/metrics.test.ts` - Tests for M6, including the "no due dates" case.
- `src/test/factories.ts` - `makeTask` gets `dueDate: null, dueTime: null`.

### Task editor (FR30)
- `src/schemas/taskForm.ts` - Due date and due time fields; a time needs a date; due date is cleared when Repeat is on.
- `src/utils/taskFormMapping.ts` - Map the due fields between the form and the task.
- `src/utils/taskFormMapping.test.ts` - Mapping tests.
- `src/components/task/DueDateField.tsx` - New. Collapsed "+ Add due date", then date + time + remove, the passed-date hint and the repeating-task text.
- `src/components/task/DueDateField.test.tsx` - Component tests.
- `src/components/task/TaskEditorForm.tsx` - Place DueDateField after Duration.
- `src/components/task/TaskEditorForm.test.tsx` - Editor tests for the due date.

### Risk markers and day summary (FR31, FR32)
- `src/hooks/useRiskClock.ts` - New. Ticks every minute and on `visibilitychange` (AC31.6, DAC23).
- `src/hooks/useTaskRisks.ts` - New. Risks for a day's tasks: a `Map` by task id, the at-risk list, and the done count.
- `src/hooks/useTaskRisks.test.tsx` - Tests with fake timers.
- `src/components/task/RiskMarker.tsx` - New. Pill with icon and text in a strong or standard style.
- `src/components/task/RiskMarker.test.tsx` - Component tests.
- `src/components/task/StickyNote.tsx` - Show the RiskMarker first in the marker row, plus due text; Stuck replaces the carried-over marker.
- `src/components/task/StickyNote.test.tsx` - Marker tests.
- `src/components/canvas/TaskCanvas.tsx`, `src/components/canvas/TimeBlockColumn.tsx`, `src/components/canvas/TimeBlockTabs.tsx`, `src/components/task/SortableStickyNote.tsx` - Pass each note its risk.
- `src/components/canvas/DaySummaryRow.tsx` - New. DayProgress + AtRiskButton.
- `src/components/canvas/DayProgress.tsx` - New. "4 of 9 done" with a decorative bar.
- `src/components/canvas/AtRiskButton.tsx` - New. "At risk · 2", hidden at 0.
- `src/components/canvas/AtRiskDialog.tsx` - New. D9, using `ResponsiveDialog`.
- `src/components/canvas/AtRiskDialog.test.tsx` - Component tests.
- `src/pages/TodayPage.tsx` - Compose the DaySummaryRow and D9 only (no logic in the page).
- `src/pages/TodayPage.test.tsx` - Page-level checks.
- `src/components/closeout/UnfinishedStep.tsx` - Show the RiskMarker after each title (AC31.5).
- `src/components/closeout/CloseoutDialog.test.tsx` - Closeout marker test.
- `src/hooks/useMetrics.ts`, `src/components/settings/StatsSection.tsx`, `src/components/settings/StatsSection.test.tsx` - The M6 tile.
- `src/utils/contrast.ts`, `src/utils/companyPalette.test.ts` - Contrast check for both marker styles (DAC28).

### Setup and intro (FR33, FR34)
- `src/hooks/useFirstRun.ts` - Treat setup in progress as not finished (AC34.5); add an "intro seen" flag.
- `src/services/onboarding/onboardingProgress.ts` - New. Read and write the setup step and the intro-seen flag (`safeStorage`).
- `src/services/onboarding/onboardingProgress.test.ts` - Unit tests.
- `src/hooks/useWelcomeFlow.ts` - Steps: intro → companies → workday → backup (restore inside backup); resume; the "I already use Taskuda" jump; finish toast.
- `src/hooks/useWelcomeFlow.test.tsx` - New. Flow tests.
- `src/hooks/useIntroCarousel.ts` - New. Slide index, next/back, keys, swipe (uses `useSwipe`).
- `src/components/welcome/IntroCarousel.tsx` - New. Region, dots, controls, focus handling.
- `src/components/welcome/IntroSlide.tsx` - New. One slide.
- `src/components/welcome/introSlides.tsx` - New. Slide content and illustrations built from real components.
- `src/components/welcome/IntroCarousel.test.tsx` - Component tests.
- `src/components/welcome/SetupStepIndicator.tsx` - New. "Step 1 of 3 · Companies".
- `src/components/welcome/SetupCompanyList.tsx` - New. Added companies, each with Remove.
- `src/components/welcome/CompanyStep.tsx` - Add several companies; next unused color preselected.
- `src/components/welcome/CompanyStep.test.tsx` - New. Component tests.
- `src/components/welcome/WorkdayStep.tsx` - New. Working days + close-out reminder.
- `src/components/welcome/WorkdayStep.test.tsx` - New. Component tests.
- `src/components/welcome/DriveStep.tsx`, `src/components/welcome/RestoreStep.tsx` - Restore shown inside the Backup step.
- `src/utils/companyPalette.ts` - `nextUnusedColorId()`.
- `src/pages/WelcomePage.tsx` - Compose the intro and the setup steps only.
- `src/pages/WelcomePage.test.tsx` - Page tests.
- `src/pages/IntroPage.tsx` - New. "/intro" replay; returns to "/settings/about".
- `src/app/router.tsx` - Add the "/intro" route (lazy-loaded).
- `src/components/settings/AboutSection.tsx` - "Show intro again".

### End-to-end and docs
- `e2e/welcome.spec.ts` - Intro skip, full setup, resume after reload, "I already use Taskuda" (DAC26, DAC27).
- `e2e/risk.spec.ts` - New. Due date, markers over time, the at-risk list (DAC22, DAC23, DAC25).
- `e2e/backup.spec.ts` - Version 3 round trip; version 2 file still imports.
- `e2e/a11y.spec.ts` - Axe and width checks for S1a, S1b steps and D9 (DAC29).
- `docs/engineering/taskuda-impl-notes.md`, `README.md`, `CHANGELOG.md` - Engineering stage artifacts.

### Notes

- Unit tests sit next to the code they test (`taskRisk.ts` and `taskRisk.test.ts`).
- `npm test` runs Vitest; `npx vitest run src/utils/taskRisk.test.ts` runs one file. `npm run e2e` runs Playwright.
- Before marking 6.0 done: `npm run lint`, `npm run typecheck`, `npm run build` must be clean.
- Rule-heavy logic (risk rules, due-date math, onboarding progress) lives in `utils/` and `services/` as pure functions; components only render. Pages only compose.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Commit or set aside the uncommitted work on `feature/taskuda-v1` (ask the owner how to split it)
  - [x] 0.2 Create and check out `feature/risk-and-onboarding` from `feature/taskuda-v1`

- [x] 1.0 Due dates (FR30)
  - [x] 1.1 Add `dueDate` and `dueTime` to `Task`, `NewTaskInput` and `TaskPatch`; update `makeTask` in the test factories
  - [x] 1.2 Add database version 5 in `database.ts`, filling both fields with `null` on existing tasks (no new index needed)
  - [x] 1.3 Save the due fields in `createTask` and `updateTask`; check that `carryOverTask` copies them and `restoreTask` keeps them (AC30.5, AC18.2), with repository tests
  - [x] 1.4 Write `utils/dueDates.ts`: due moment (no time = 23:59 local), `isDuePassed`, short labels ("Due today", "Due tomorrow", "Due Fri, Oct 24", with time) and spoken labels, with unit tests
  - [x] 1.5 Bump the backup format to version 3 in `backupFile.ts` and `backupSnapshot.ts`; versions 1 and 2 parse with `dueDate: null, dueTime: null`; tests for all three (AC30.6)
  - [x] 1.6 Add the due fields to `taskForm.ts` and `taskFormMapping.ts`: a time needs a date; switching Repeat on clears the due date; mapping tests
  - [x] 1.7 Build `DueDateField` (collapsed button, date + optional time, Remove, passed-date hint with `aria-describedby`, repeating-task text, focus moves as in design Section 7), with component tests
  - [x] 1.8 Add `DueDateField` to `TaskEditorForm` after Duration; editor tests for add, remove, past date and repeating
  - [x] 1.9 Confirm Calendar sync and Jira ignore the due fields (Out of Scope item 24); add one assertion to the calendar mapping test

- [x] 2.0 At-risk rules and markers (FR31)
  - [x] 2.1 Add `types/risk.ts` (`RiskKind`, `TaskRisk` with kind and the time it refers to)
  - [x] 2.2 Write `utils/taskRisk.ts`: the AC31.1 rules (10-minute grace, 30-minute default duration from `effectiveMinutes`, Done and past days give no risk) and the AC31.2 priority
  - [x] 2.3 Test `taskRisk` for every rule, every combination of rules (DAC24), and boundary clocks: 23:59 → 00:00, the Evening block after midnight, exactly 10 minutes late, exactly at the end time (RK19)
  - [x] 2.4 Write `utils/riskLabels.ts` for the visible and spoken marker text in design Section 8, with tests
  - [x] 2.5 Add `useRiskClock` (one-minute tick plus `visibilitychange`) and `useTaskRisks(tasks, dayKey)`, with fake-timer tests (AC31.6, DAC23)
  - [x] 2.6 Build `RiskMarker` (strong and standard styles, lucide icons from design Section 10, wraps rather than truncates), with component tests
  - [x] 2.7 Update `StickyNote`: the RiskMarker comes first in the marker row; due text shows when there is no Overdue or Due today marker; Stuck replaces the carried-over marker; extend `taskAriaLabel`; update the note tests
  - [x] 2.8 Pass each note's risk from `TaskCanvas` through the columns, the mobile tabs and `SortableStickyNote`
  - [x] 2.9 Show the RiskMarker after each title in `UnfinishedStep` (AC31.5), with a closeout test
  - [x] 2.10 Extend the contrast check so both marker styles reach ≥ 4.5:1 in light and dark (DAC28); adjust the tokens in `index.css` if not
  - [x] 2.11 Confirm no sound, speech, toast or notification is ever triggered by a risk change (AC31.7): a test with the speech and toast fakes

- [ ] 3.0 Day progress, the at-risk list and M6 (FR32, AC17.3)
  - [ ] 3.1 Build `DayProgress` ("4 of 9 done", "All 9 done", bar `aria-hidden`, bar hidden under 360px)
  - [ ] 3.2 Build `AtRiskButton` (hidden at 0; accessible name "2 tasks at risk. Show list"; 44px target)
  - [ ] 3.3 Build `AtRiskDialog` (D9) on `ResponsiveDialog`: titles for today and other days, rows sorted by `atRiskTasks()`, the "Nothing at risk right now." state, focus rules; choosing a row closes D9 and opens the task in the editor through `canvasUiStore`
  - [ ] 3.4 Build `DaySummaryRow`; compose it and D9 in `TodayPage` between the notices and the canvas; hide it when the day has no tasks; past days show progress only
  - [ ] 3.5 Component tests for the three pieces, and a `TodayPage` test that a status change updates the count right away (AC32.1)
  - [ ] 3.6 Add `deadlinesMet()` to `metrics.ts` (the latest change to Done in the activity log against the due moment, 4-week window), with unit tests
  - [ ] 3.7 Add the M6 tile to `useMetrics` and `StatsSection` with the "No due dates yet." empty state; update the Stats tests

- [ ] 4.0 First-run setup (FR34)
  - [ ] 4.1 Write `services/onboarding/onboardingProgress.ts` (saved step, intro seen, setup done) on `safeStorage`, with tests
  - [ ] 4.2 Change `useFirstRun` so a device with setup in progress goes back to "/welcome" even when it already has a company (AC34.5); a device with data and no progress record still counts as done (Out of Scope item 29)
  - [ ] 4.3 Add `nextUnusedColorId()` to `companyPalette.ts`, with a test
  - [ ] 4.4 Build `SetupCompanyList` and rework `CompanyStep`: add several companies, the form clears and keeps focus, "Acme added" is announced, Remove with the focus rules, Continue only once ≥ 1 company exists, Skip for now always shown, the duplicate-name error
  - [ ] 4.5 Build `WorkdayStep` with `WeekdayPicker` and the close-out reminder, saving through the existing workday settings service; Skip keeps the defaults
  - [ ] 4.6 Show the restore choice inside the Backup step instead of as a separate step; keep the existing connect, error and restore behavior
  - [ ] 4.7 Build `SetupStepIndicator` and remove the hard-coded "Step N of 3"
  - [ ] 4.8 Rework `useWelcomeFlow`: steps companies → workday → backup, save the step on every change, resume, finish shows the "You're all set" toast (touch-screen variant through `useMediaQuery`) and goes to "/"
  - [ ] 4.9 Tests for `useWelcomeFlow`, `CompanyStep`, `WorkdayStep` and `WelcomePage`, including resume after a remount

- [ ] 5.0 Intro slides (FR33)
  - [ ] 5.1 Write `useIntroCarousel` (index, next, back, go to, ←/→ keys, swipe through `useSwipe`), with tests
  - [ ] 5.2 Build `IntroSlide` and `introSlides.tsx` with the four slides' copy and illustrations built from real Taskuda components (no image files)
  - [ ] 5.3 Build `IntroCarousel`: carousel region semantics, only the current slide exposed, dots as buttons with `aria-current`, focus moves to the new heading, Skip on every slide, no auto-advance, reduced motion
  - [ ] 5.4 First run: show the intro before setup in `WelcomePage`; "Get started" → Companies; "I already use Taskuda" → Backup; Skip → Companies; mark the intro seen
  - [ ] 5.5 Add `IntroPage` and the lazy "/intro" route for replay (last slide shows "Done"; Skip and Done go back to "/settings/about"; no data changes)
  - [ ] 5.6 Add "Show intro again" to `AboutSection`
  - [ ] 5.7 Component tests for `IntroCarousel` (keyboard, dots, Skip, focus) and a test that replay changes no data

- [ ] 6.0 Verification and docs
  - [ ] 6.1 `e2e/risk.spec.ts`: add a due date (DAC22), markers appear and change with a mocked clock (DAC23), open an at-risk task in 2 interactions (DAC25)
  - [ ] 6.2 `e2e/welcome.spec.ts`: skip everything to Today in ≤ 5 interactions (DAC26), add 3 companies (DAC27), reload mid-setup resumes, "I already use Taskuda" reaches Backup
  - [ ] 6.3 `e2e/backup.spec.ts`: export and import a version 3 file; a version 2 file still imports
  - [ ] 6.4 `e2e/a11y.spec.ts`: axe and the 320/768/1280 width checks for S1a, each S1b step and D9 (DAC29)
  - [ ] 6.5 Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` and `npm run e2e`; fix anything that fails
  - [ ] 6.6 Do the User-Relevance Review (workspace rule) on the notes, D9, setup and the M6 tile: no raw IDs, enum values or ISO dates shown
  - [ ] 6.7 Update `docs/engineering/taskuda-impl-notes.md`: the decisions from the design spec notes (due-date storage, where the risk function lives, setup resume, the M6 timestamp), the database v5 / backup v3 migration and rollback, and a test map for AC30–AC34 and DAC22–DAC29
  - [ ] 6.8 Update `README.md` (features) and `CHANGELOG.md`
  - [ ] 6.9 Self-review the full diff against the Definition of Done checklist, item by item
