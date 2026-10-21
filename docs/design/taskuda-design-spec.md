# Taskuda — Design Spec

**Track:** A
**Upstream:** [docs/pm/taskuda-prd.md](../pm/taskuda-prd.md) (Definition of Ready passed, waiver W1)
**Status:** Definition of Ready — passed (see Section 11)
**Last updated:** 2026-10-21

**Revision 2026-10-20:** added design for PRD FR18–FR29: flows F14–F17, the S7h Workday settings section, dialog D8, new states on S2, S3 and S7f, microcopy, and DAC15–DAC21.

**Revision 2026-10-21:** added design for PRD FR30–FR34. F1 is rewritten (intro, then a 3-step setup). New: flows F18–F19, S1 split into S1a Intro and S1b Setup, the S2 day summary row and risk markers, the S3 due date, dialog D9 At-risk list, the M6 tile, "Show intro again" in S7g, and DAC22–DAC29.

Requirement IDs (FR, NFR, AC, CR) refer to the PRD. Screen IDs (S), flow IDs (F), and component names are defined here.

---

## 1. Traceability Map

| PRD requirement | Priority | Screen(s) | Flow(s) |
|---|---|---|---|
| FR1 Time-block canvas | Must | S2 Today | F2 |
| FR2 Create/edit/delete task | Must | S2 Today, S3 Task Editor, D1 Delete Confirm | F2 |
| FR3 Move and reorder | Must | S2 Today, D2 Timed-Task Move | F3 |
| FR4 3-state toggle | Must | S2 Today (StickyNote) | F4 |
| FR5 Companies and colors | Must | S1 Welcome, S7a Companies, D3 Delete Company | F1, F2 |
| FR6 Local-first, offline | Must | App shell (SyncStatusIndicator), all screens | F2, F7 |
| FR7 Drive backup/restore | Must | S1 Welcome, S7c Backup, D4 Restore Confirm, D5 Unlock | F7, F8 |
| FR8 Calendar sync | Should | S7b Integrations, S2 Today (event-sourced notes) | F9 |
| FR9 Voice engine | Should | S7e Voice, S2 Today (ReminderCatchup) | F11 |
| FR10 EOD closeout | Must | S5 Closeout (steps 1–2) | F5 |
| FR11 Carryover | Must | S5 Closeout step 1, S2 Today (carried-over marker) | F5 |
| FR12 BYOK AI key | Must | S7d AI & Security, D5 Unlock, D6 Set Passphrase | F10 |
| FR13 AI recommendations | Must | S5 Closeout step 3 | F5 |
| FR14 Report builder | Must | S5 Closeout step 4, S6 Report | F5, F6 |
| FR15 Jira | Should | S7b Integrations, D7 Link Jira Issue, S3 Task Editor | F12 |
| FR16 Installable PWA | Must | App shell (InstallPrompt), S7g About | F13 |
| FR17 Metrics view | Must | S7f Stats | — |
| NFR1 Offline | Must | App shell (OfflineBanner) | F2 |
| NFR5 Key security | Must | S7d (SecretField, masked) | F10 |
| NFR7 Least-privilege scopes | Must | S7b, S7c (scope explanation copy) | F7, F9 |
| NFR8 Accessibility | Must | All (see Section 7) | F3 keyboard path |
| NFR9 Browser support | Must | S7e (unsupported state), S2 (catch-up) | F11 |
| CR1 BYO Google client ID | Could | S7b Integrations (Advanced) | F9 alt |
| CR2 Export/import file | Could | S7c Backup | F8 alt |
| FR18 Undo delete | Should | S2 Today, S3 (Delete task), D1 → undo toast | F2 alt |
| FR19 Working days | Should | S7h Workday | F5, F16 |
| FR20 Recurring tasks | Should | S3 Task Editor (Repeat), S2 (repeats marker), D1 repeating variant, D8 Edit Repeating | F14 |
| FR21 Closeout nudge | Should | S2 (nudge banner), S7h Workday | F16 |
| FR22 Snooze / Mark done from reminder | Should | S2 (reminder toasts) | F11 |
| FR23 Quiet hours | Should | S7h Workday | F11, F15 |
| FR24 Report summary line | Should | S5 step 4, S6 Report | F5, F6 |
| FR25 Overlap warning | Should | S2 (overlap marker), S3 (overlap warning) | F2 alt |
| FR26 Carry-over insights | Should | S7f Stats | — |
| FR27 Time left in block | Should | S2 (block header / mobile tab strip) | — |
| FR28 Eye-break reminders | Should | S2 (eye-break toast), S7h Workday, S7f Stats (M4) | F15 |
| FR29 In-app time budget | Should | S2 (budget banner), S7h Workday, S7f Stats (M5, time in Taskuda) | F17 |
| FR30 Due dates | Should | S3 Task Editor (Due date), S2 (due text on notes), S7f Stats (M6) | F18 |
| FR31 At-risk markers | Should | S2 (RiskMarker on notes), S5 step 1 | F19 |
| FR32 Day progress + at-risk list | Should | S2 (day summary row), D9 At-risk list | F19 |
| FR33 Intro slides | Should | S1a Intro, S7g About ("Show intro again") | F1, F20 |
| FR34 First-run setup | Should | S1b Setup (Companies, Workday, Backup) | F1 |

Day navigation (DayNavigator on S2) has no requirement of its own. It is needed for AC8.3 (events appear "on the right day") and AC11.1 (carried tasks appear on the next day).

---

## 2. User Flows

### F1 — First run
*Rewritten 2026-10-21 for FR33–FR34.*
1. User opens Taskuda for the first time → **S1a Intro**, slide 1 of 4. Next / swipe / → moves on; Back / ← goes back. *Alt:* "Skip" on any slide → step 2.
2. Last slide: "Get started" → **S1b Setup** step 1. *Alt:* "I already use Taskuda" → setup step 3 (Backup), so a returning user restores before entering anything (PRD RK22).
3. Step 1 **Companies**: type a name (next unused color is preselected; can be changed) → "Add company" or Enter → it joins the list above the form, the form clears and keeps focus. Repeat as needed. Each listed company has a Remove button. → "Continue" (shown once ≥ 1 company). *Alt:* "Skip for now" (always shown). *Failure:* duplicate name → inline field error; save failed → inline error, input kept.
4. Step 2 **Workday**: working days (Mon–Fri preselected) and close-out reminder (5:30 PM preselected, or Off) → "Continue" saves. *Alt:* "Skip" keeps the defaults. *Failure:* last working day unselected → the WeekdayPicker keeps it selected and shows the hint.
5. Step 3 **Backup**: as before: Connect (Google consent) → looks for an existing backup before making the first one. Backup found → the restore choice appears inside this step (Restore → F8 / Start fresh). *Alt:* "Not now". *Failure:* consent cancelled or denied → inline error, Try again or Skip.
6. → **S2 Today** with empty states and the toast "You're all set…".
7. *Interrupted:* the tab is closed during setup → the next open goes straight to the step it was on (no intro), with saved companies and settings in place.

### F18 — Add a due date (FR30)
1. In S3, user presses "Add due date" → Due date (date input, focused) and Due time (optional) appear, with a "Remove due date" button.
2. Pick a date → Save. The note shows "Due Fri, Oct 24".
3. *Alt:* the chosen date has passed → hint under the field "This date has passed. The task will show as overdue." Save still works.
4. *Alt:* Repeat is set to anything but "Doesn't repeat" → the due date section is replaced by "Repeating tasks don't have due dates." If a due date was already entered, it is dropped when Repeat changes, and the hint says so.

### F19 — Check what's at risk (FR31, FR32)
1. On S2, the day summary row shows "4 of 9 done" and, when something is at risk, "At risk · 2".
2. Press "At risk · 2" → **D9 At-risk list** opens, sorted Overdue → Overran → Running late → Due today → Stuck, then by start time.
3. Choose a task → D9 closes, S3 opens for that task. User changes the time, the due date or the status → Save → the note's marker updates right away, and so does the count.
4. *Alt:* every task stops being at risk while D9 is open → D9 shows "Nothing at risk right now." with Close.
5. *Alt (closeout):* in S5 step 1, each unfinished task shows its marker next to the title; nothing else changes.

### F20 — Show intro again (FR33)
1. S7g About → "Show intro again" → S1a in replay mode.
2. Slides behave as in F1. The last slide has only "Done"; Skip and Done both return to S7g About. No data changes.

### F2 — Add a task
1. On S2, user presses **+ Add task** (or key `N`, or the empty-block "Add a task" link, which preselects that block).
2. **S3 Task Editor** opens with the title focused. Block defaults to the current time of day (Morning 05:00–11:59, Afternoon 12:00–16:59, Evening 17:00–04:59).
3. User types a title → Enter (or "Save") → note appears in the block, with a toast "Task added".
4. *Alt:* user adds notes, company, start time, duration, Jira link before saving. Setting a start time sets the block to match.
5. *Failure:* empty title → inline "Give the task a title." on submit or blur, and nothing is saved (Save stays enabled so the error can be discovered; changed during build). *Failure:* local save fails (storage full or blocked) → error toast with "Try again", and the editor stays open with the input kept.
6. *Alt (FR25):* the start time and duration overlap another task that isn't done on that day → an inline warning under Duration: "Overlaps with Client call (2:00–2:30 PM)." Save still works. After saving, both notes show the overlap marker.
7. *Alt (FR18):* the user deletes a task (note menu or editor) → D1 → Delete → toast "Task deleted" with **Undo** for 10 s → Undo puts the task back in the same place, with the toast "Task restored". After 10 s the toast closes and the delete stays.

### F3 — Move a task
1. User drags a note to another position or block → it drops there and the order is saved.
2. *Keyboard/alt path:* focus note → open note menu (`…` or `M`) → "Move to Morning / Afternoon / Evening", "Move up", "Move down". Or with dnd-kit keyboard: Space to pick up, arrows to move, Space to drop, Esc to cancel.
3. *Alt:* the note has a start time and is dropped in a block that doesn't contain that time → **D2 Timed-Task Move**: "Remove time and move" / "Cancel". Cancel returns the note to where it was.
4. *Failure:* save fails → note goes back to its original spot, error toast.

### F4 — Change status
1. User taps the StatusToggle on a note → To Do → In Progress → Done → To Do.
2. Done: note color is desaturated, the title is struck through, with a check icon and a "Done" label; if voice is on, the completion cheer plays (F11).
3. *Alt:* note menu → "Set status" → pick any of the three directly.

### F5 — End-of-day closeout
1. User presses **Close out day** (app bar) → **S5 Closeout**, timer start saved (M3). Available on today and on past days that were never closed out (a forgotten day still gets its carryover, to the day after it); not on future days. *Changed during build.*
2. **Step 1 Unfinished tasks:** each non-Done task has two options: "Carry over" / "Delete". A bulk button "Carry over all" sets every undecided task. "Next" stays enabled but doesn't advance until every task has an outcome; a counter shows how many still need a decision and turns into an error after pressing Next. *Changed during build (disabled buttons hide why).* *Alt:* zero unfinished tasks → step shows "Everything's done. Nice." and Next is enabled.
3. **Step 2 Reflect:** rating 1–5 (required), reflection text (optional). Pressing Next without a rating shows "Pick a rating to continue." and stays on the step.
4. **Step 3 AI recommendations:**
   - First time only: disclosure panel listing what will be sent → "Send to <provider>" / "Skip AI today".
   - Loading → recommendations shown.
   - *Alt:* no key → "Add an AI key in Settings to get recommendations." + "Skip". *Alt (added during build):* key saved but locked on this device → "Unlock your keys to get recommendations." + Unlock. *Alt:* offline → offline message + "Skip". *Failure:* provider error → message with reason + "Try again" / "Skip".
5. **Step 4 Report:** scope (All companies / one company), format tabs (Slack, Teams, Jira, Email), preview, **Copy report** (copy time saved for M3). *Failure:* clipboard blocked → "Couldn't copy automatically. Select the text and copy it manually." and the preview text is selected.
6. **Finish day** → carryover applied, closeout log saved → S2 shows the "Day closed" banner.
7. *Exit:* "Close" (X) at any step → confirm "Leave closeout? Your choices so far will be kept." → choices saved as a draft; reopening resumes at the same step.

### F6 — Report without closeout
1. App bar **Report** → **S6 Report** for the current day → same controls as closeout step 4 → Copy.
2. *Alt:* nothing done yet today → empty state "Nothing to report yet."

### F7 — Connect Drive and back up
1. S7c Backup → "Connect Google Drive" → Google consent (app-data scope only) → connected → first backup runs → "Backed up just now".
2. Later changes back up automatically when online; the SyncStatusIndicator shows status.
3. *Alt:* offline → indicator "Offline · changes saved on this device", and the backup runs when the connection returns.
4. *Failure:* session expired and silent renew fails → indicator "Reconnect Google" + banner button → consent → resumes. *Failure:* Drive error → "Backup failed" + "Try again"; local data unaffected.

### F8 — Restore on a new device
1. Fresh device → S1 step 3 (or S7c "Restore from Drive") → list of backup versions (date, time, device name) → pick one.
2. **D4 Restore Confirm**: replaces local data; warns if the backup came from another device.
3. Backup contains encrypted secrets → **D5 Unlock**: enter passphrase → restored → S2.
4. *Alt:* wrong passphrase → "That passphrase doesn't match." Retry, or "Restore without keys" (tasks restored, AI key and Jira token must be re-entered).
5. *Alt (CR2):* "Import from file" → pick file → D4 → same.
6. *Failure:* backup file unreadable → "This backup can't be read. Try an older version." and the version list stays open.

### F9 — Connect Calendar
1. S7b Integrations → Google Calendar "Connect" → consent (events scope) → pick a calendar (default: primary) → "Sync on".
2. Tasks with a start time become events; events become event-sourced notes (calendar icon) on their day.
3. *Alt:* user turns sync off → existing tasks stay; nothing is deleted.
4. *Failure:* sync error → indicator "Calendar sync paused" + reason + "Try again".
5. *Alt (CR1):* Advanced → "Use your own Google client ID" → paste ID → reconnect.

### F10 — Add AI key
1. S7d → choose provider (Gemini / OpenRouter) → paste key → model (preset default) → Save.
2. First secret on this device → **D6 Set Passphrase** (enter + confirm) → saved → key shown as `••••••••abcd` + "Test key".
3. "Test key" → "Key works" / "Key rejected by <provider>".
4. *Failure:* passphrases don't match → inline error. *Alt:* "Remove key" → confirm → removed.

### F11 — Voice reminder
1. Task with start time → N minutes before: spoken "Up next at 2:00: Client call" + visual toast. At start: "Starting now: Client call" + toast. On Done: short cheer + toast.
2. *Alt:* app was in background/closed when a reminder was due → on return, **ReminderCatchup** panel: "You missed 2 reminders" with the list + "Dismiss".
3. *Alt:* browser can't speak → toasts still show; S7e shows the unsupported message.
4. *Alt (FR22):* the "Up next" / "Starting now" toast stays until the user acts. Actions: **Snooze 5 min** · **Snooze 15 min** · **Mark done** · close (X). Snooze → toast "Reminder snoozed until 2:15 PM.", and the same reminder comes back then. Mark done → the task becomes Done, with the cheer (same as F4).
5. *Alt (FR23):* during quiet hours the toast shows but nothing is spoken.

### F12 — Jira
1. S7b → Jira "Connect" → site URL, email, API token → "Test connection" → connected (token encrypted, D6 if first secret).
2. S3 Task Editor → "Link Jira issue" → **D7** → paste key or URL → preview (key, title, status) → Link.
3. Status mapping in S7b: Taskuda To Do / In Progress / Done → Jira status for each (optional). With a mapping, status changes update Jira. *Build notes:* the token is saved only after "Test connection" succeeds; status names come from the site ("Load Jira statuses"); when the workflow has no transition to the mapped status, the task still changes and a toast says to update the issue in Jira; linking happens inside the task editor and is saved with the task.
4. *Failure:* issue not found / no permission / token rejected → specific message (Section 8). Task still saves without the link.

### F13 — Install
1. Supported browser and not installed → InstallPrompt (dismissible) in app bar: "Install Taskuda" → browser install dialog.
2. *Alt:* dismissed → not shown again for 30 days; still available in S7g About.
3. New version deployed → toast "Taskuda updated. Reload to get the latest version." + "Reload".

### F14 — Make a task repeat (FR20)
1. S3 Task Editor → **Repeat** select (under Time of day): Doesn't repeat · Every day · Every working day · Weekly · Monthly.
2. Weekly → a WeekdayPicker appears, with the task's own weekday preselected; at least one day is required. Monthly → "On day" select (1–31), preselected to the task's date; the hint "In shorter months, it moves to the last day." shows for days 29–31.
3. Save → the note shows the repeats marker; matching days from today onward show an occurrence when opened.
4. *Edit an occurrence:* change any field → Save → **D8 Edit Repeating**: "This task only" / "This and future tasks" / Cancel.
5. *Delete an occurrence:* D1 repeating variant: "This task only" / "This and future tasks" / Cancel → undo toast (F2 step 7). Undo also brings the series back.
6. *Alt:* yesterday's occurrence was carried over → today shows only the carried copy (with both markers), not a second occurrence.
7. *Failure:* Weekly with no day selected → inline "Pick at least one day." on Save.

### F15 — Eye break (FR28)
1. Eye breaks are on (S7h), it's a working day, during eye-break hours, not quiet hours, and Taskuda is open → after each interval a toast appears at the top: "Time for an eye break. Look at something far away for 20 seconds." Actions: **Done** · **Snooze 5 min**. If voice is on, it also says "Time for an eye break."
2. Done → the toast closes and the outcome is logged (M4). The next prompt is one interval later.
3. *Alt:* Snooze → it comes back in 5 minutes. Close (X) → logged as dismissed.
4. *Alt:* the prompt came due while Taskuda was in the background → it shows once on return, with "(missed while you were away)" added, logged as missed.
5. *Alt:* a new prompt comes due while the previous one is still open → the old one is replaced and logged as missed.

### F16 — Closeout nudge (FR21)
1. Working day, nudge time reached, today not closed out, Taskuda open → the nudge banner on S2 ("It's 5:30 PM. Ready to close out your day?" with **Close out day** · **Not today**), a toast with the same text, and a spoken line if voice is on and it's not quiet hours.
2. Close out day → F5. The banner goes away when the closeout finishes.
3. Not today → the banner is hidden until the next working day.
4. *Alt:* Taskuda opened after the nudge time → banner only, no toast or voice.
5. *Alt:* the user is viewing another day → the banner still shows, and Close out day opens today's closeout.

### F17 — Time budget warning (FR29)
1. A budget is set (S7h) and today's time in Taskuda passes it → a toast and the budget banner on S2: "You've spent 2 h in Taskuda today, past your 2 h budget. A short break might help." with **Dismiss**.
2. Dismiss → the banner hides; at most one more warning after each extra hour ("3 h in Taskuda today…").
3. Nothing is locked. All actions keep working.

---

## 3. Screen & State Inventory

Dialogs (D1–D7) are listed after the screens.

### S1a Intro (first run, and replay from S7g; 4 slides)
| State | Spec |
|---|---|
| Default | Taskuda wordmark, slide illustration (built from real UI pieces: StickyNotes, a block header, a report snippet; no images to load), heading, one or two lines of body, dots, Back (hidden on slide 1) / Next, Skip top-right |
| Loading | N/A — static content, part of the welcome bundle |
| Empty | N/A — always has content |
| Error | N/A — no data or network involved |
| Success | Last slide: "Get started" + "I already use Taskuda" (first run) or "Done" (replay) |

### S1b Setup (first run, 3 steps; was "S1 Welcome")
| State | Spec |
|---|---|
| Default | Step indicator "Step 1 of 3 · Companies" (… "Workday", … "Backup"), step content, primary + skip actions |
| Loading | Saving a company or the workday: button spinner (rarely visible). Google consent/backup check: button spinner, label "Connecting…" |
| Empty | Companies step with no companies yet: no list, just the form, and only "Skip for now" (no Continue) |
| Error | Field errors (duplicate company name). Inline Alert under the step with the specific error + retry (save failed, Google consent) |
| Success | Company added: it appears in the list and is announced ("Acme added"). Step done → next step. Backup step done → S2 Today + "You're all set" toast |
| Backup found | Inside step 3: "Found a backup from Oct 17" with Restore / Start fresh (no step 4) |

### S2 Today (main canvas)
| State | Spec |
|---|---|
| Default | App bar (DayNavigator, + Add task, Report, Close out day, SyncStatusIndicator, Settings) + three TimeBlockColumns with StickyNotes |
| Loading | First open only: Skeleton notes (3 per block) until local data loads (expected < 300 ms) |
| Empty | Per block: EmptyBlockState "Nothing planned for the morning." + "Add a task" link. Whole day empty and no companies: also a one-line hint "Tip: add companies in Settings to color-code your tasks." |
| Error | Local storage unavailable (private mode or blocked): full-width Alert "Taskuda can't save on this device. Your browser is blocking storage…" (Section 8) — editing disabled |
| Success | Toast confirmations (added, deleted, moved via menu); "Day closed at 6:12 PM · View report" banner after closeout |
| Past day | Read-only. Banner "You're viewing Tue, Oct 14. Tasks from past days can't be edited." |
| Offline | OfflineBanner (thin, dismissible) "You're offline. Everything still saves on this device." |
| Time left (FR27) | Today only: the current block's header shows "1 h 20 min left" after the block name for Morning and Afternoon (none for Evening). On mobile it shows under the tab list for the current tab. Muted text, tabular numbers. |
| Notices (FR21, FR29) | Above the blocks, in the existing notices area, in this order: storage error → offline → nudge banner → budget banner. At most two banners show at once; the budget banner waits if two are already showing. |
| Note markers (FR20, FR25) | Repeats marker (repeat icon + "Repeats daily" / "Working days" / "Weekly" / "Monthly"). Overlap marker (warning icon + "Overlaps with Client call"; "Overlaps with 2 tasks" when more than one). Shown next to the existing carried-over and calendar markers. |
| Alert toasts (FR22, FR28) | Reminder and eye-break toasts stay until the user acts or closes them. Only one eye-break toast at a time. |
| Day summary row (FR32) | A thin row between the notices area and the blocks, on every screen size: DayProgress "4 of 9 done" (left) and, when ≥ 1 task is at risk, the "At risk · 2" button (right). Hidden when the day has no tasks. Past days show progress only (no risk, AC31.3). |
| Due text (FR30) | Notes with a due date show it in the marker row ("Due Fri, Oct 24"), with a calendar-clock icon. Replaced by the RiskMarker when the task is Overdue or Due today. |
| Risk markers (FR31) | At most one RiskMarker per note, first in the marker row, in the AC31.2 order. Overdue and Overran use the strong style; Running late, Due today and Stuck use the standard style (Section 10). Stuck replaces the carried-over marker ("Stuck · carried over ×4") so the count isn't shown twice. |

### S3 Task Editor (Dialog on ≥768px, bottom Sheet on <768px)
| State | Spec |
|---|---|
| Default | Fields: Title*, Company, Block, Repeat (+ WeekdayPicker or "On day" when needed), Start time, Duration, Due date (collapsed to an "Add due date" button until used; then Due date + Due time (optional) + Remove due date), Notes, Jira link (if Jira connected); Save, Cancel; Delete (edit mode only) |
| Due date passed (FR30) | Hint under Due date: "This date has passed. The task will show as overdue." Doesn't block Save |
| Repeating (FR30) | Due date section replaced by muted text "Repeating tasks don't have due dates." |
| Loading | Save button spinner (rarely visible) |
| Empty | Create mode: empty fields, title focused, Repeat = Doesn't repeat |
| Error | Inline field errors (including "Pick at least one day."); save-failed toast with input kept |
| Warning | Overlap warning under Duration (FR25); doesn't block Save |
| Success | Closes; toast "Task added" / "Changes saved" |

### S5 Closeout (full-screen on <768px, large Dialog on ≥768px, 4 steps)
| State | Spec |
|---|---|
| Default | CloseoutStepper "Step 1 of 4" + step content + Back / Next |
| Loading | Step 3 only: "Getting recommendations…" with Skeleton lines; "Skip" still available |
| Empty | Step 1 with zero unfinished tasks: "Everything's done. Nice." |
| Error | Step 3: no key / offline / provider error (F5.4). Step 4: clipboard error |
| Success | Finish → closes, S2 "Day closed" banner, toast "Day closed. 3 tasks carried to tomorrow." |
| Already closed | Opening again shows "You closed out today at 6:12 PM." + "View report" + "Close out again" (replaces the earlier log entry for that day) |
| Risk markers (FR31) | Step 1: each unfinished task shows its RiskMarker after its title (AC31.5). No other change to the step |

### S6 Report
| State | Spec |
|---|---|
| Default | Scope Select, FormatSwitcher tabs, ReportPreview (all-companies scope starts with the summary line, FR24), Copy report |
| Loading | N/A — generated locally and instantly |
| Empty | No tasks for the scope: "Nothing to report yet." (Copy disabled) |
| Error | Clipboard blocked (F5.5) |
| Success | Copy button changes to "Copied" with a check for 2 s + aria-live announcement |

### S7 Settings (sections in a side nav on ≥1024px, list → subpage on smaller screens)
Sections: **S7a Companies, S7h Workday, S7b Integrations, S7c Backup, S7d AI & Security, S7e Voice, S7f Stats, S7g About** (nav order; S7h is new and sits second because it's used more than the integrations).

| Section | Default | Loading | Empty | Error | Success |
|---|---|---|---|---|---|
| S7a Companies | List of CompanyChips with rename/recolor/delete; "Add company" | N/A (local) | "No companies yet. Add one to color-code your tasks." | Duplicate name inline error | Toast "Company saved" |
| S7b Integrations | IntegrationCards: Google Calendar, Jira; each with status + actions; Advanced (CR1) collapsed | Card spinner while connecting/testing | Not connected: description + "Connect" | Card Alert with reason + retry | "Connected" badge, last sync time |
| S7c Backup | Drive status, "Last backed up …", Back up now, Restore from Drive, Export / Import (CR2) | "Backing up…" | Not connected: "Your data is only on this device." + Connect | "Backup failed" + Try again | "Backed up just now" |
| S7d AI & Security | Provider, SecretField, model, Test key, Remove; Passphrase: "Change passphrase", "Reset secrets" | Test key spinner | No key: "No AI key added. AI recommendations are off." | Key rejected / test failed | "Key works" |
| S7e Voice | Voice on/off, reminder lead time (Off, 5, 10, 15 min), voice choice, "Play test" | N/A | N/A | Unsupported: "Your browser can't speak reminders. You'll still see them on screen." (controls disabled) | Test plays |
| S7f Stats | Six MetricTiles (M1–M6; M6 shows "No due dates yet" when no task with a due date falls in the window; M4/M5 show "Off" with a link to Workday when that feature is off) + one-line explanation each. "Time in Taskuda" line (today + 7-day average, "on this device"). **Carry-over** subsection: rate per company and overall, "Needs attention" callouts, list of tasks carried 3+ times | N/A (local) | Before first closeout: "Your stats appear after your first closeout." Carry-over with no past tasks: "Carry-over stats appear once you have past days." | N/A — calculated locally; if logs can't be read, same as storage error on S2 | N/A |
| S7h Workday | Working days (WeekdayPicker), Close-out reminder (Off / time), Quiet hours (switch + from/to times), Eye breaks (switch, interval Select, from/to times), Daily time budget (Off / 1–4 h). Each saves on change. | N/A (local) | N/A — always has defaults | All working days unticked: the last one can't be unticked, with the hint "Keep at least one working day." Quiet-hours or eye-break start = end: "Start and end can't be the same." | Toast "Saved" (one per change, merged) |
| S7g About | Version, Install button (if available), "Show intro again" (FR33, opens S1a replay), Privacy summary, link to privacy page | N/A | N/A | N/A | N/A |

### Dialogs
| ID | Purpose | States |
|---|---|---|
| D1 Delete Task | "Delete this task?" Delete / Cancel. Repeating variant: This task only / This and future tasks / Cancel | Default, Success (toast with Undo for 10 s, FR18). No loading/empty/error: local action; failure → save-failed toast |
| D8 Edit Repeating | "Change repeating task?" This task only / This and future tasks / Cancel | Default only (local); on Cancel the editor stays open with the changes kept |
| D2 Timed-Task Move | "Move to Evening? This task starts at 2:00 PM." Remove time and move / Cancel | Default only (local) |
| D3 Delete Company | Company has tasks: "Remove company from tasks" / "Cancel". No tasks: simple confirm | Default, Success |
| D4 Restore Confirm | Version info, warning, Restore / Cancel | Default, Loading ("Restoring…"), Error (unreadable), Success (→ S2, toast "Restored backup from Oct 17, 9:14 PM") |
| D5 Unlock | Passphrase field, Unlock, "Restore without keys" | Default, Loading, Error (wrong passphrase), Success |
| D6 Set Passphrase | Passphrase + confirm + warning copy | Default, Error (mismatch / too short, min 8 chars), Success |
| D7 Link Jira Issue | Key/URL input → preview → Link | Default, Loading ("Looking up issue…"), Error (not found / no access / offline), Success (preview card) |
| D9 At-risk list (FR32) | Title + one row per at-risk task: RiskMarker, title, CompanyChip, start time. Rows are buttons whose accessible name is their visible text. Dialog on ≥768px (560px wide, the shared ResponsiveDialog; changed during build from 480px), bottom Sheet on <768px | Default (list). Empty: "Nothing at risk right now." + Close (only reachable when the count drops to 0 while open). Loading: N/A (local, already loaded for S2). Error: N/A (local). Success: choosing a row closes D9 and opens S3 for that task |

---

## 4. Information Architecture

```
App shell
├── S2 Today (home, "/")            ← default route; DayNavigator switches date ("/day/2026-10-19")
│   ├── S3 Task Editor (overlay)
│   ├── S5 Closeout (overlay, resumable)
│   └── D1, D2, D7, D8, D9 (overlays)
├── S6 Report ("/report", optional ?date=)
├── S7 Settings ("/settings/<section>")
│   └── S7a–S7h (S7h = "/settings/workday"; S7g "Show intro again" → "/intro")
├── S1a Intro → S1b Setup ("/welcome", first run only; redirects to "/" afterwards)
└── S1a Intro, replay ("/intro"; Skip/Done → "/settings/about")
```

- **First run:** "/welcome" shows S1a, then S1b. When setup was interrupted (F1 step 7), "/welcome" opens S1b at the saved step. Browser Back inside "/welcome" moves to the previous slide/step instead of leaving; on slide 1 it does nothing.

- **App bar (all main screens):** Logo/name → S2 Today. DayNavigator (‹ prev, date label, next ›, "Today"). + Add task. Report. Close out day. SyncStatusIndicator. Settings (gear).
- **Mobile (<768px):** app bar holds DayNavigator + Settings; Add task is a floating button (bottom-right); Report and Close out day are in a bottom action bar.
- **Back behavior:** overlays close with Esc, the X button, or the browser Back button (overlays push a history entry). Settings subpages go back to the Settings list on mobile. Closeout Back moves to the previous step; browser Back on step 1 triggers the leave confirmation.
- **Future days:** editable (for planning and carried-over tasks). **Past days:** read-only.
- **Keyboard shortcuts:** `N` new task, `T` go to today, `[` / `]` previous / next day, `?` shortcut list. Disabled while typing in a field.

---

## 5. Component Inventory

`[REUSE]` = shadcn/ui component (the project's base design system). `[NEW]` = custom component for Taskuda.

| Component | Tag | Used on | Rationale (NEW only) |
|---|---|---|---|
| Button, Input, Textarea, Label, Select, Switch, RadioGroup | [REUSE] | All forms | |
| Dialog, Sheet, AlertDialog | [REUSE] | S3, S5, D1–D7 | |
| Tabs | [REUSE] | S2 mobile blocks, S6 formats | |
| DropdownMenu | [REUSE] | Note menu | |
| Toast (Sonner) | [REUSE] | All | |
| Alert | [REUSE] | Errors, banners | |
| Badge, Tooltip, Skeleton, Separator, Card | [REUSE] | Various | |
| AppShell / AppBar | [NEW] | All | Layout specific to Taskuda's actions |
| DayNavigator | [NEW] | S2 | Prev/next/today date control; no shadcn equivalent |
| TimeBlockColumn | [NEW] | S2 | Drop zone + header + empty state for one block |
| StickyNote | [NEW] | S2 | Core visual: company tint, status, markers, drag handle |
| StatusToggle | [NEW] | StickyNote | 3-state cycle control with icon + label (not a checkbox or switch) |
| CompanyChip | [NEW] | S2, S3, S7a, S6 | Color swatch + name, used everywhere a company appears |
| ColorSwatchPicker | [NEW] | S1, S7a | Fixed palette of 10 accessible colors; shadcn has no color picker |
| EmptyBlockState | [NEW] | S2 | Block-specific copy + add link |
| SyncStatusIndicator | [NEW] | App bar | One spot showing local/Drive/Calendar state |
| OfflineBanner | [NEW] | App shell | Thin persistent banner; Alert is too heavy |
| CloseoutStepper | [NEW] | S5 | 4-step progress with resume |
| OutcomeChooser | [NEW] | S5 step 1 | Per-task Carry over / Delete segmented choice |
| RatingInput | [NEW] | S5 step 2 | 1–5 radio styled as five buttons |
| RecommendationList | [NEW] | S5 step 3 | AI output with disclosure and states |
| FormatSwitcher + ReportPreview | [NEW] | S5 step 4, S6 | Shows the copied text exactly as it will paste |
| SecretField | [NEW] | S7b, S7d | Masked-after-save field showing last 4 chars only |
| IntegrationCard | [NEW] | S7b, S7c | Status + actions + error for one integration |
| MetricTile | [NEW] | S7f | Number + label + explanation |
| ReminderCatchup | [NEW] | S2 | Missed-reminder list panel |
| InstallPrompt | [NEW] | App bar, S7g | Wraps the browser install event |
| ToggleGroup | [REUSE] | WeekdayPicker | shadcn/ui; add with the CLI (not yet in the project) |
| WeekdayPicker | [NEW] | S3 (Weekly), S7h | Seven toggle buttons (Mon–Sun) with a "keep at least one" rule; ToggleGroup alone has no minimum |
| RepeatField | [NEW] | S3 | Repeat select plus the WeekdayPicker or day-of-month field that goes with it |
| TimeRangeField | [NEW] | S7h (quiet hours, eye-break hours) | Two labeled time inputs with the "can't be the same" rule and an overnight hint |
| BlockTimeLeft | [NEW] | S2 block header, mobile tab strip | Ticking countdown with a quiet aria-live policy (see Section 7) |
| NoticeBanner | [NEW] | S2 nudge and budget banners | Alert plus one or two actions and a dismiss. Wraps Alert so the two banners look and behave the same |
| AlertToast actions | [REUSE] | Reminder, eye-break, undo toasts | Sonner toasts with action buttons and `duration: Infinity` (10 s for undo) |
| CarryoverInsights | [NEW] | S7f | Per-company rates, callouts and the carried 3+ list; MetricTile only holds one number |
| ResponsiveDialog | [REUSE] | D9 | Already in the project (Dialog ≥768px, Sheet <768px) |
| CompanyForm, ColorSwatchPicker, CompanyChip | [REUSE] | S1b step 1 | Existing Taskuda components |
| WeekdayPicker | [REUSE] | S1b step 2 | Existing Taskuda component |
| StepCard | [REUSE] | S1b | Existing welcome step wrapper |
| DueDateField | [NEW] | S3 | Collapsed "Add due date" → date + optional time + remove, with the passed-date hint and the repeating rule; no shadcn date-and-time field fits |
| RiskMarker | [NEW] | StickyNote, D9, S5 step 1 | One icon + text pill with two visual strengths; the existing note markers are plain text and have no strong style |
| DayProgress | [NEW] | S2 day summary row | "4 of 9 done" with a thin progress bar; no existing progress component |
| AtRiskButton | [NEW] | S2 day summary row | Count button that opens D9, with the accessible name "At risk · 2, show 2 tasks"; hidden at 0 |
| IntroCarousel | [NEW] | S1a | Slides with dots, Back/Next, swipe (uses the existing useSwipe hook) and arrow keys; shadcn has no carousel in this project, and adding Embla for 4 static slides isn't worth the dependency |
| IntroSlide | [NEW] | S1a | Illustration + heading + body for one slide |
| SetupCompanyList | [NEW] | S1b step 1 | List of companies added so far, each with Remove; Settings' S7a list has rename/recolor/delete menus that are too heavy for setup |
| SetupStepIndicator | [NEW] | S1b | "Step 1 of 3 · Companies"; replaces the hard-coded "Step N of 3" text |

---

## 6. Responsive & Platform Behavior

| Breakpoint | S2 Today | Overlays | Settings |
|---|---|---|---|
| **Mobile < 768px** | One block at a time via Tabs (Morning / Afternoon / Evening), opening on the current block; tab labels show task counts. Swipe between tabs. Floating Add button, bottom action bar. Dragging across blocks: drag onto a tab to switch blocks. | S3 as bottom Sheet; S5 full screen | List → subpage |
| **Tablet 768–1023px** | Three columns, equal width, notes full column width | Dialogs (max 560px wide; S5 max 720px) | List → subpage |
| **Desktop ≥ 1024px** | Three columns, max content width 1280px, centered | Same as tablet | Side nav + content |

- **Installed PWA:** standalone window; app bar respects safe areas (`env(safe-area-inset-*)`) on phones.
- **Android Chrome:** full support target. **iOS Safari:** best effort; voice and install may be limited, so show the unsupported messages instead of broken controls.
- **Drag start (all devices):** dragging starts from the note's drag handle (grip icon), so the note body scrolls normally on touch and keeps no nested controls inside a draggable element. Changed during build from "long-press on the note".
- Minimum supported width: 320px with no horizontal scrolling.
- **New pieces (FR18–FR29):** NoticeBanner actions wrap below the text under 480px. WeekdayPicker shows single letters (M T W T F S S) under 400px and three-letter names above, with full day names as accessible labels either way. In S7h, TimeRangeField stacks its two inputs under 400px. Action toasts put their buttons on a second line on mobile.
- **New pieces (FR30–FR34):**
  - **S2 day summary row:** one line on every width. Under 360px the progress bar is hidden and only the "4 of 9 done" text shows. The At-risk button stays right-aligned and keeps a 44px target.
  - **RiskMarker:** wraps to its own line in the marker row when the note is narrow. The text is never truncated, because the reason is the whole point.
  - **S3 DueDateField:** date and time side by side at ≥400px, stacked below that.
  - **D9:** bottom Sheet under 768px (max 80% of the screen height, scrolls), Dialog (max 480px wide) above.
  - **S1a Intro:** full-height layout. The illustration sits above the text under 768px and beside it at ≥1024px. Dots and buttons are pinned to the bottom on mobile, respecting safe areas. Swipe works on touch only. Arrow keys work everywhere.
  - **S1b Setup:** the existing single column (max 576px). The company list scrolls inside the step once it has more than 5 companies.

---

## 7. Accessibility Requirements

Target: **WCAG 2.1 AA**.

- **Contrast:** text ≥ 4.5:1 against its background, including text on every company-tinted note; large text and UI parts (borders, icons, focus ring) ≥ 3:1. The 10-color palette must be validated for both light and dark themes before build.
- **Not color alone:** company is shown by color **and** name (CompanyChip); status by icon **and** label (○ To Do, ◐ In Progress, ✓ Done).
- **Focus order on S2:** app bar left to right → Morning notes top to bottom → Afternoon → Evening. Within a note: title (opens editor) → StatusToggle → menu → drag handle (title first so the note reads naturally; changed during build).
- **Focus visible:** 2px ring with 2px offset, ≥ 3:1 contrast, on every interactive element.
- **Overlays:** focus moves into the overlay on open, is trapped inside, and goes back to the triggering element on close.
- **Drag-and-drop alternatives:** keyboard dragging (Space/arrows/Space/Esc) with spoken instructions and announcements ("Picked up Client call. Morning, position 2 of 4."), plus the "Move to…" menu.
- **Screen-reader labels:**
  - StatusToggle: `aria-label="Status: In Progress. Change to Done"`.
  - Note: `aria-label="Client call, Acme, 2:00 PM, In Progress"`.
  - Calendar-sourced and carried-over icons have text labels ("From Google Calendar", "Carried over twice").
  - Color swatches: color name as label ("Teal").
- **Toasts** appear at the top center, just below the app bar, so they never cover the phone bottom action bar or the day navigator (changed during build; moved below the app bar on 2026-10-20).
- **Live regions:** status changes, task moves, "Copied", sync errors, and step changes in S5 are announced through a polite `aria-live` region.
- **Audio equivalents:** every spoken voice alert has a matching on-screen toast.
- **Touch targets:** ≥ 44×44 px (StatusToggle, note menu, tabs, FAB, swatches).
- **Motion:** with `prefers-reduced-motion`, drag animations, toasts, and step transitions use fades or no animation.
- **Forms:** every field has a visible label; errors are tied to fields with `aria-describedby` and appear on blur or submit.
- **Zoom:** usable at 200% browser zoom without loss of content.
- **Undo toast (FR18):** Undo is a real button and can be reached with Tab. While focus is inside the toast, the 10 s timer pauses. The deletion is announced as "Task deleted. Undo available."
- **Action toasts (FR22, FR28):** they never take focus on their own, so typing in a field isn't interrupted. They're announced politely. `Alt+T` moves focus to the newest action toast (added to the `?` shortcut list).
- **Time left (FR27):** the visible text updates every minute, but it's not a live region, so screen readers aren't interrupted every minute. The block header's accessible name includes it ("Afternoon, 1 hour 20 minutes left").
- **WeekdayPicker:** each toggle has `aria-pressed` and a full day name ("Monday"). The group is labeled ("Working days" / "Repeat on").
- **Markers:** repeats and overlap markers have text labels and are part of the note's `aria-label`, for example "Client call, Acme, 2:00 PM, In Progress, repeats weekly, overlaps with Standup".
- **Eye-break prompts** contain no flashing or motion, and with `prefers-reduced-motion` they appear with no animation.
- **RiskMarker (FR31):** icon + text, never color alone. Its text has ≥ 4.5:1 contrast against the marker's own background in light and dark, on all 10 note tints (DAC28). The note's `aria-label` includes it, for example "Client call, Acme, 10:00 AM, To Do, running late". The marker is not a live region: markers changing as time passes are not announced.
- **Day summary row (FR32):** DayProgress is plain text with a decorative bar (`aria-hidden`). The At-risk button's accessible name starts with its visible text (WCAG 2.5.3): "At risk · 2, show 2 tasks" ("At risk · 1, show 1 task"). *(Changed during build: the first wording failed the label-in-name check.)* Count changes are not announced (AC32.4). D9 follows the overlay rules: focus goes to the first row, Esc closes it, and focus returns to the button (or to the editor's trigger once a task is chosen).
- **DueDateField (FR30):** "Add due date" is a button. After it's pressed, focus moves to the date input. The passed-date hint is tied to the input with `aria-describedby`. "Remove due date" returns focus to the "Add due date" button.
- **IntroCarousel (FR33):** a region with `aria-roledescription="carousel"` and label "About Taskuda". Each slide is a group labeled "Slide 2 of 4". Only the current slide is in the accessibility tree. Dots are buttons ("Go to slide 3", `aria-current="step"` on the current one). ←/→ move between slides when focus is inside the carousel. Slides never advance on their own. When the slide changes, focus moves to the new slide's heading. With `prefers-reduced-motion`, slides switch with no sliding animation. Touch targets for dots are 44×44px, even though each dot is drawn smaller.
- **S1b Setup (FR34):** the step indicator is in the page heading's accessible text ("Step 1 of 3, Companies"). Adding a company announces "Acme added" through the polite live region and keeps focus in the name field. Remove buttons are labeled "Remove Acme"; after removing, focus moves to the next row's Remove, or to the name field when the list is empty.

---

## 8. Microcopy

### App bar & S2
| Element | Copy |
|---|---|
| Add button | + Add task |
| Close out button | Close out day |
| Report button | Report |
| Today button | Today |
| Block headers | Morning · Afternoon · Evening |
| Empty block | Nothing planned for the morning. / …the afternoon. / …the evening. — link: Add a task |
| Day closed banner | Day closed at 6:12 PM · View report |
| Past day banner | You're viewing Tue, Oct 14. Tasks from past days can't be edited. |
| Carried-over marker | Carried over (×2 when carried more than once) |
| Offline banner | You're offline. Everything still saves on this device. |
| Storage error | Taskuda can't save on this device. Your browser is blocking storage, often because of private browsing. Open Taskuda in a normal window to keep your tasks. |
| Sync indicator | Saved on this device · Backed up 2 min ago · Backing up… · Offline · Reconnect Google · Backup failed · Calendar sync paused |
| Reminder catch-up | You missed 2 reminders while Taskuda was in the background. — Dismiss |
| Time left | 1 h 20 min left · 45 min left · 1 min left |
| Repeats marker | Repeats daily · Repeats on working days · Repeats weekly · Repeats monthly |
| Overlap marker | Overlaps with Client call · Overlaps with 2 tasks |
| Undo toast | Task deleted — Undo. After Undo: Task restored. Repeating, "This and future": Repeating task deleted — Undo |
| Reminder toast actions | Snooze 5 min · Snooze 15 min · Mark done. After snooze: Reminder snoozed until 2:15 PM. |
| Nudge banner / toast | It's 5:30 PM. Ready to close out your day? — Close out day · Not today |
| Nudge voice line | "It's 5:30 PM. Time to close out your day." |
| Eye-break toast | Time for an eye break. Look at something far away for 20 seconds. — Done · Snooze 5 min. Missed: (missed while you were away) appended |
| Eye-break voice line | "Time for an eye break." |
| Budget banner / toast | You've spent 2 h in Taskuda today, past your 2 h budget. A short break might help. — Dismiss |
| Due text (FR30) | Due today · Due tomorrow · Due Fri, Oct 24. With a time: Due today 5:00 PM · Due Fri, Oct 24, 5:00 PM |
| Risk markers (FR31) | **Overdue** · due Oct 20 (same day: Overdue · due 5:00 PM) · **Overran** · ended 2:30 PM · Running late · 10:00 AM · Due today · Due today 5:00 PM · Stuck · carried over ×4 |
| Risk markers, spoken (in the note label) | overdue, due October 20 · overran, ended 2:30 PM · running late, was due to start at 10:00 AM · due today at 5:00 PM · stuck, carried over 4 times |
| Day progress (FR32) | 4 of 9 done · All 9 done · 0 of 3 done |
| At-risk button | At risk · 2. Accessible name: At risk · 2, show 2 tasks |
| D9 At-risk list | Title: At risk today (other days: At risk on Wed, Oct 22). Row: (marker) · (title) · (company) · (time). Empty: Nothing at risk right now. — Close |
| Setup done toast (FR34) | You're all set. Press N or + to add your first task. Touch screens: You're all set. Tap + to add your first task. |

### S3 Task Editor
| Element | Copy |
|---|---|
| Titles | New task · Edit task |
| Fields | Title · Company · Time of day · Repeat · Start time (optional) · Duration (optional) · Due date · Due time (optional) · Notes (optional) · Jira issue (optional) |
| Due date (FR30) | Button: + Add due date. Remove: Remove due date. Passed hint: This date has passed. The task will show as overdue. Repeating: Repeating tasks don't have due dates. When Repeat is turned on with a due date set: Due date removed. Repeating tasks don't have due dates. |
| Repeat options | Doesn't repeat · Every day · Every working day · Weekly · Monthly. Weekly: Repeat on (weekdays). Monthly: On day (1–31). Hint for 29–31: In shorter months, it moves to the last day. Error: Pick at least one day. |
| Overlap warning | Overlaps with Client call (2:00–2:30 PM). You can still save. |
| Company empty option | No company |
| Buttons | Save · Cancel · Delete task · Link Jira issue |
| Title error | Give the task a title. |
| Save failed | Couldn't save this task. Your input is still here. — Try again |
| Toasts | Task added · Changes saved · Task deleted |

### Dialogs
| Dialog | Copy |
|---|---|
| D1 | **Delete this task?** It will be removed from today and from your report. — Delete · Cancel |
| D2 | **Move to Evening?** This task starts at 2:00 PM, which is in the afternoon. — Remove time and move · Cancel |
| D3 | **Delete Acme?** 4 tasks are tagged with Acme. They'll keep their content but lose the company tag. — Delete company · Cancel |
| D4 | **Restore this backup?** This replaces everything on this device with the backup from Oct 17, 9:14 PM. — Restore · Cancel. Different-device warning: This backup was made on another device ("Windows · Chrome"). Changes made here since then will be lost. |
| D5 | **Enter your passphrase** to unlock your AI key and Jira token. — Unlock · Restore without keys. Error: That passphrase doesn't match. Try again, or restore without keys and add them again later. |
| D6 | **Set a passphrase** — It protects your AI key and Jira token, including in your Drive backup. You'll only need it on a new device. If you forget it, you'll need to add your keys again — nothing else is lost. Fields: Passphrase · Confirm passphrase. Errors: Use at least 8 characters. / The passphrases don't match. |
| D1 repeating | **Delete repeating task?** Delete only this one, or this one and all future ones? Past days aren't changed. — This task only · This and future tasks · Cancel |
| D8 | **Change repeating task?** Apply your changes to this task only, or to this and all future ones? Past days aren't changed. — This task only · This and future tasks · Cancel |
| D7 | **Link a Jira issue** — Paste an issue key (ABC-123) or link. Buttons: Look up · Link · Cancel. Errors: We couldn't find ABC-123 on yoursite.atlassian.net. Check the key. / Your Jira token doesn't have access to this issue. / You're offline. Link the issue when you're back online. |

### S5 Closeout
| Element | Copy |
|---|---|
| Title | Close out Monday, Oct 18 |
| Step labels | Unfinished · Reflect · Recommendations · Report |
| Step 1 heading | What happens to these tasks? |
| Step 1 options | Carry over · Delete — bulk: Carry over all |
| Step 1 counter | 2 tasks still need a decision |
| Step 1 empty | Everything's done. Nice. |
| Step 2 heading | How did today go? |
| Rating labels | 1 Rough · 2 Meh · 3 Okay · 4 Good · 5 Great |
| Reflection label | Anything worth remembering? (optional) |
| Rating error (on Next) | Pick a rating to continue. |
| Step 3 heading | Recommendations for tomorrow |
| Disclosure | To get recommendations, Taskuda sends today's task titles, statuses, companies, carryovers, and your reflection to Gemini using your key. Nothing is sent to Taskuda. — Send to Gemini · Skip AI today |
| Loading | Getting recommendations… |
| No key | Add an AI key in Settings to get recommendations. — Open Settings · Skip |
| Offline | You're offline, so recommendations aren't available. You can still finish your closeout. — Skip |
| Provider error | Gemini didn't respond: (reason, e.g. "the key was rejected" / "rate limit reached" / "the request timed out"). — Try again · Skip |
| Step 4 heading | Your report |
| Finish | Finish day |
| Leave confirm | **Leave closeout?** Your choices so far will be kept. — Leave · Keep going |
| Done toast | Day closed. 3 tasks carried to tomorrow. When the next working day isn't tomorrow (FR19): Day closed. 3 tasks carried to Monday. |
| Already closed | You closed out today at 6:12 PM. — View report · Close out again |

### S6 Report
| Element | Copy |
|---|---|
| Scope | All companies · (company names) |
| Formats | Slack · Teams · Jira · Email |
| Summary line (all companies) | 8 done · 3 in progress · 2 carried to tomorrow, across 3 companies. Zero counts are left out ("5 done, across 2 companies"); one company says "across 1 company". |
| Report sections | Done · In progress · Carried to tomorrow (Carried to Monday when the next working day isn't tomorrow, FR19) |
| Copy button | Copy report → Copied |
| Empty | Nothing to report yet. Mark tasks done and they'll show up here. |
| Clipboard error | Couldn't copy automatically. The text is selected — press Ctrl+C (⌘C on Mac) to copy it. |

### S7 Settings
| Element | Copy |
|---|---|
| Section names | Companies · Workday · Integrations · Backup · AI & Security · Voice · Stats · About |
| Workday | **Working days** — Taskuda carries tasks over, keeps your streak and sends reminders on these days. Hint: Keep at least one working day. · **Close-out reminder** — Remind me to close out at: Off / (time). Default 5:30 PM. · **Quiet hours** — No spoken alerts or eye-break prompts from (time) to (time). Reminders still show on screen. · **Eye breaks** — Remind me to rest my eyes: Every 20 / 30 / 45 / 60 minutes, from (time) to (time) on working days. Only while Taskuda is open. · **Daily time budget** — Warn me after this much time in Taskuda: Off / 1 h / 2 h / 3 h / 4 h. Counts only time Taskuda is on screen on this device. · Error: Start and end can't be the same. · Toast: Saved |
| Companies empty | No companies yet. Add one to color-code your tasks. — Add company |
| Duplicate name | You already have a company called Acme. |
| Drive not connected | Your data is only on this device. Connect Google Drive to back it up. Taskuda can only see its own backup file, not your other Drive files. — Connect Google Drive |
| Backup actions | Back up now · Restore from Drive · Export to file · Import from file |
| Backup failed | Backup failed: (reason). Your data is still safe on this device. — Try again |
| Calendar card | Show tasks with a start time in Google Calendar, and calendar events as tasks. — Connect · Sync with: (calendar) · Turn off sync |
| Calendar paused | Calendar sync paused: (reason). — Try again |
| Reconnect | Your Google session expired. — Reconnect Google |
| Jira card | Link tasks to Jira issues and keep statuses in step. — Connect. Fields: Jira site (yoursite.atlassian.net) · Email · API token. Help link: How to create an API token. Test: Test connection → Connected as (name) / Jira rejected this token. Check the email and token. |
| Status mapping | When a task becomes In Progress, set the Jira issue to: (select) |
| Advanced (CR1) | Use your own Google client ID — For people who set up their own Google Cloud project. |
| AI section | Provider: Gemini · OpenRouter. API key · Model · Test key · Remove key. Results: Key works. / (Provider) rejected this key. Empty: No AI key added. AI recommendations are off. |
| Spending hint | Tip: set a monthly spending limit in your Gemini or OpenRouter account. |
| Security | Change passphrase · Reset secrets (removes your AI key and Jira token from this device and your backup) |
| Voice | Spoken reminders · Remind me before a task starts: Off / 5 / 10 / 15 minutes · Voice · Play test. Unsupported: Your browser can't speak reminders. You'll still see them on screen. |
| Voice lines | "Up next at 2:00 PM: Client call." (time includes AM/PM, changed during build) · "Starting now: Client call." · Cheers (random): "Nice work." / "Done. On to the next." / "That's one off the list." |
| Stats | Tasks dropped without a decision · Closeout streak (working days) · Median time to report · Eye breaks taken · Days within time budget · Deadlines met (explanation: Tasks with a due date that were done on time, last 4 weeks. Empty: No due dates yet.). Off tiles: Eye breaks are off. — Turn on in Workday / No time budget set. — Set one in Workday. Empty: Your stats appear after your first closeout. |
| Time in Taskuda | Time in Taskuda today: 1 h 12 min · 7-day average: 54 min (on this device, not total screen time) |
| Carry-over | Heading: Carry-over, last 4 weeks · Row: Acme — 40% carried over · Overall — 22% · Callout: Needs attention: Acme — 40% of tasks carried over in the last 4 weeks. · List heading: Carried over 3+ times · Row: Write onboarding doc (Acme) — carried 4 times · Empty: Carry-over stats appear once you have past days. |
| About | Install Taskuda · Show intro again · Version (number) · Your data stays on your device and in your own Google Drive. Taskuda has no server that stores your tasks or keys. |
| Update toast | Taskuda updated. Reload to get the latest version. — Reload |
| Install prompt | Install Taskuda for one-click access. — Install · Not now |

### S1a Intro (FR33)
| Slide | Copy |
|---|---|
| 1 | **One board for every job.** Each employer gets a color, and every task is a sticky note, so you can see whose work is whose at a glance. |
| 2 | **Plan by time of day.** Put tasks in Morning, Afternoon or Evening. Taskuda reminds you before timed tasks start and flags work that's slipping. |
| 3 | **Close out. Drop nothing.** At the end of the day, decide what happens to every unfinished task. Whatever you carry over is waiting for you on your next working day. |
| 4 | **Your report, ready to send.** Copy an end-of-day report for Slack, Teams, Jira or email in one click. Your tasks stay on this device and in your own Google Drive. |
| Controls | Skip · Back · Next. Last slide (first run): Get started · I already use Taskuda. Last slide (replay): Done. Dots: Go to slide (n). Region label: About Taskuda |

### S1b Setup (FR34)
| Step | Copy |
|---|---|
| Indicator | Step 1 of 3 · Companies · Step 2 of 3 · Workday · Step 3 of 3 · Backup |
| Step 1 | **Who do you work for?** — Add each employer or client. Their color tags your tasks. Fields: Company name · Color. Button: Add company. After adding: Acme added (announced). Row action: Remove (Remove Acme). Footer: Continue (once ≥ 1 company) · Skip for now. Error: You already have a company called Acme. Save failed: Couldn't save Acme. Try again. |
| Step 2 | **Your workday** — Taskuda carries tasks over, keeps your streak and reminds you on these days. Fields: Working days · Close-out reminder (switch) · Remind me to close out at (time). Hint: Keep at least one working day. Footer: Continue · Skip (keeps Monday–Friday and 5:30 PM). Save failed: Couldn’t save your workday. Try again, or skip and change it later in Settings. *(Switch and error copy added during build, matching S7h.)* |
| Step 3 | **Back up to Google Drive** — Your tasks are saved on this device. Back them up to your own Drive so you never lose them. — Connect Google Drive · Not now. Error: Google sign-in was cancelled. You can connect later in Settings. — Try again · Skip |
| Step 3, backup found | **Found a backup from Oct 17** — Restore it to pick up where you left off? — Restore · Start fresh |

---

## 9. Design Acceptance Criteria

| ID | Criterion | How to test |
|---|---|---|
| DAC1 | Creating a task with only a title takes ≤ 3 interactions from S2 (press `N` or tap +, type, Enter). | Manual count; e2e test |
| DAC2 | Changing a task's status takes exactly 1 tap/click or 1 keypress on the focused toggle. | e2e test |
| DAC3 | A note dropped after dragging shows its new position within 100 ms of release. | Performance trace |
| DAC4 | Closeout with 5 unfinished tasks can be finished in ≤ 8 interactions (Close out day, Carry over all, Next, rating, Next, Skip, Copy, Finish). | e2e test |
| DAC5 | "Copied" confirmation appears within 300 ms of pressing Copy report. | e2e test |
| DAC6 | Inline field validation appears on blur and on submit, never while typing the first character. | Component test |
| DAC7 | Every error message names what went wrong and offers at least one action (retry, skip, open settings, or a manual alternative). | Copy review against Section 8 |
| DAC8 | Every screen in Section 3 renders correctly at 320px, 768px, and 1280px width with no horizontal scrolling. | Playwright screenshots |
| DAC9 | All S2 actions (add, edit, move between blocks, reorder, status, delete) work with keyboard only. | Manual keyboard pass + e2e |
| DAC10 | axe reports 0 WCAG 2.1 AA violations on S2, S3, S5 (each step), S6, and each S7 section. | Automated axe in Playwright |
| DAC11 | Every company palette color gives ≥ 4.5:1 text contrast on its note in light and dark themes. | Contrast check script on the palette |
| DAC12 | Every spoken alert shows a matching toast within 500 ms. | e2e with speech mocked |
| DAC13 | Leaving and reopening the closeout resumes at the same step with the same choices. | e2e test |
| DAC14 | A saved secret is never displayed in full: only the last 4 characters, in every screen. | Component test |
| DAC15 | A deleted task can be restored with 1 interaction (Undo), with the keyboard or the mouse, any time within 10 s of the delete. | e2e test |
| DAC16 | Snoozing or completing a task from its reminder takes 1 interaction on the toast. | e2e with fake timers |
| DAC17 | Making a new task repeat weekly on one day adds ≤ 2 interactions to DAC1 (choose Weekly; the task's own weekday is preselected). | e2e test |
| DAC18 | No reminder, eye-break, nudge or budget alert ever moves keyboard focus or clears text being typed. | e2e: type in the editor while alerts fire |
| DAC19 | From the nudge banner, the closeout opens with 1 interaction. | e2e test |
| DAC20 | The time-left text changes to the next block within 60 s of a block boundary. | Component test with fake timers |
| DAC21 | Every number shown for in-app time is labeled "on this device" or "in Taskuda" on the same screen. | Copy review + component test |
| DAC22 | Adding a due date to a new task adds ≤ 2 interactions to DAC1 (Add due date, pick a date). | e2e test |
| DAC23 | A RiskMarker appears or changes within 60 s of the moment its rule becomes true, and within 1 s of the tab becoming visible again. | Component test with fake timers |
| DAC24 | No note ever shows more than one RiskMarker, for every combination of the AC31.1 states. | Unit test over all combinations |
| DAC25 | From S2, opening an at-risk task in the editor takes 2 interactions (At risk, then the task). | e2e test |
| DAC26 | The intro can be left in 1 interaction from any slide. A brand-new user can reach S2 in ≤ 5 interactions by skipping everything (Skip, Skip for now, Skip, Not now). | e2e test |
| DAC27 | Adding each company in setup takes ≤ 2 interactions after typing the name (Enter or Add company; the color is preselected), and focus stays in the name field. | e2e test |
| DAC28 | RiskMarker text has ≥ 4.5:1 contrast on its background, in both styles, light and dark, on all 10 note tints. | Contrast check script (extends DAC11) |
| DAC29 | S1a, S1b (each step) and D9 are added to the DAC8 width checks and the DAC10 axe run with 0 violations. | Playwright screenshots + axe |

---

## 10. Visual Direction (guidance for build)

- **Feel:** a calm desk with paper notes, not a dashboard. Warm off-white canvas (dark theme: deep warm charcoal), notes as soft-tinted paper cards with a subtle shadow and a company-color top edge.
- **Type:** one readable sans for UI; note titles slightly larger and heavier than metadata. Tabular numbers for times and stats.
- **Company palette:** 10 fixed hues (for example teal, coral, amber, violet, sky, rose, lime, indigo, orange, slate), each with a light note tint, a strong edge color, and dark-theme variants, all passing DAC11.
- **Status:** Done notes are desaturated with a struck-through title and a check (not dimmed with opacity, which would break text contrast); In Progress notes get a thicker top edge and a ◉ icon.
- **Light and dark themes,** following the system setting.
- **Risk markers (FR31):** a small pill on a near-opaque neutral background (paper white / charcoal) so it reads the same on every company tint. **Strong style** (Overdue, Overran): the destructive red for icon and text, semibold. **Standard style** (Running late, Due today, Stuck): the note's text color, medium weight. Icons: Overdue `CircleAlert`, Overran `TimerOff`, Running late `Clock`, Due today and plain due text `CalendarClock`, Stuck `Repeat`. Only two strengths, so the canvas stays calm (PRD RK18).
- **Day summary row:** quiet, muted text. The progress bar is 4px tall and uses the foreground color at low opacity, with no company colors. The At-risk button is an outline button with the `CircleAlert` icon.
- **Intro illustrations:** made from real Taskuda pieces (a few sticky notes in company colors, a block header with "1 h 20 min left", a report snippet), slightly scaled down. That way the intro shows the actual product and needs no image downloads.
- Visual craft (exact tokens, spacing scale) is finalized during build with the `frontend-design` / `ui-ux-pro-max` skills, within the constraints above.

---

## 11. Definition of Ready

- [x] Every Must/Should PRD requirement has at least one row in the Traceability Map (Section 1)
- [x] Every screen has default, loading, empty, error, success states defined or marked N/A with a reason (Section 3)
- [x] No microcopy is placeholder text (Section 8). Values in parentheses, such as (reason) or (company names), are filled from data at runtime, not left for later.
- [x] Component inventory tags every component [REUSE] or [NEW] (Section 5)
- [x] Accessibility requirements are specific values (Section 7)
- [x] Responsive/platform behavior is specified for every screen (Section 6)
- [x] Design Acceptance Criteria exist and are testable by someone else (Section 9)
- [x] File is committed at `docs/design/taskuda-design-spec.md`

Re-checked on 2026-10-20 for FR18–FR29: each has a Traceability row; S7h and D8 have their states; all new copy is final; new components are tagged; accessibility, responsive behavior and DAC15–DAC21 are specified.

Re-checked on 2026-10-21 for FR30–FR34: each has a Traceability row. S1a, S1b, the new S2/S3/S5 states and D9 have their states. All new copy is final (Section 8). New components are tagged. Accessibility, responsive behavior and DAC22–DAC29 are specified.

### Notes for the Software Engineer stage
These are engineering decisions the design depends on. They are noted here, not decided:
- Default model for each AI provider (S7d preset). **Decided:** Gemini `gemini-3.5-flash-lite` (Google's recommendation for new projects, Oct 2026); OpenRouter `openrouter/auto`. The model is a text field so users can change it without an app update.
- Which side wins when a task and its calendar event are both edited between syncs (PRD RK6). **Decided:** the later edit wins (task `updatedAt` vs the event's `updated` time); a task edited after its event was deleted keeps itself and gets a new event. Other build decisions: scopes `calendar.events.owned` + `calendar.calendarlist.readonly` (narrowest that work); all-day events aren't turned into tasks; tasks from a week ago onwards sync, events up to 90 days ahead are pulled; a carried-over copy gets its own event on its new day; switching calendars starts fresh and leaves existing events where they are.
- How many Drive backup versions to keep (PRD RK7). **Decided:** the newest 10, one file each in the hidden app-data folder. Google access tokens stay in memory only (no refresh token in a browser-only app): after a reload or after about an hour, backups resume silently when Google allows it, otherwise the indicator shows "Reconnect Google" and one click resumes them.
- Whether "Close out again" replaces or appends the day's closeout log entry for M2/M3 (design assumes replace). **Decided:** replace, keeping the first closeout's start/copy times for M3.
- *(FR20)* How occurrences are stored: created when a day is opened, or computed from the series on the fly. The design only needs AC20.2–AC20.5 to hold, and every occurrence to behave like a normal task once it exists (status, move, carryover, calendar). **Decided:** real tasks, created when today or a future day is shown (and on each reminder check for today). A carried copy stands in for that day's occurrence.
- *(FR28, FR29)* Whether the eye-break log and the daily in-app time are backed up to Drive or kept on this device only (like `device.*` settings). In-app time is per device by definition. **Decided:** both stay on this device; neither is in backups or export files. Their settings are backed up.
- *(FR22, FR28)* Snoozed reminders and eye-break timing after a reload: keep pending snoozes across a reload, or drop them. **Decided:** pending reminder and eye-break snoozes survive a reload. The eye-break interval restarts from when Taskuda was opened.
- *(FR30)* How the due date is stored: a local date plus an optional local time (matching `dayKey` / `startTime`), or a single timestamp. The design needs "no time = end of that day" and needs local-time display.
- *(FR31)* Where the risk rules live: a pure function of (task, now, today's day key) so DAC24 can test every combination without rendering, and so S2, D9 and S5 share it.
- *(FR34, AC34.5)* How the setup position survives a closed tab. The current first-run check treats "has a company" as "welcome done". That has to change, or adding a company and closing the tab skips the rest of setup.
- *(FR17, M6)* Which timestamp counts as "done on time": the latest change to Done in the activity log, compared with the due moment.
