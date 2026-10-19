# Taskuda — Design Spec

**Track:** A
**Upstream:** [docs/pm/taskuda-prd.md](../pm/taskuda-prd.md) (Definition of Ready passed, waiver W1)
**Status:** Definition of Ready — passed (see Section 11)
**Last updated:** 2026-10-18

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

Day navigation (DayNavigator on S2) has no requirement of its own. It is needed for AC8.3 (events appear "on the right day") and AC11.1 (carried tasks appear on the next day).

---

## 2. User Flows

### F1 — First run
1. User opens Taskuda for the first time → **S1 Welcome**.
2. Step 1 "Add your first company": name + color → Continue. *Alt:* "Skip for now". Tasks can exist with no company.
3. Step 2 "Back up to Google Drive" → Connect (Google consent) → connected. *Build note:* connecting here looks for an existing backup before making the first one, so a fresh empty backup never becomes the "newest" over the real one. *Alt:* "Not now", so data stays on this device only and S2 shows a "Not backed up" indicator. *Failure:* consent cancelled or denied → inline error, retry or skip.
4. Step 3 "Restore existing data?" (only shown if a Drive backup is found) → F8.
5. → **S2 Today** with empty states.

### F2 — Add a task
1. On S2, user presses **+ Add task** (or key `N`, or the empty-block "Add a task" link, which preselects that block).
2. **S3 Task Editor** opens with the title focused. Block defaults to the current time of day (Morning 05:00–11:59, Afternoon 12:00–16:59, Evening 17:00–04:59).
3. User types a title → Enter (or "Save") → note appears in the block, with a toast "Task added".
4. *Alt:* user adds notes, company, start time, duration, Jira link before saving. Setting a start time sets the block to match.
5. *Failure:* empty title → inline "Give the task a title." on submit or blur, and nothing is saved (Save stays enabled so the error can be discovered; changed during build). *Failure:* local save fails (storage full or blocked) → error toast with "Try again", and the editor stays open with the input kept.

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

### F12 — Jira
1. S7b → Jira "Connect" → site URL, email, API token → "Test connection" → connected (token encrypted, D6 if first secret).
2. S3 Task Editor → "Link Jira issue" → **D7** → paste key or URL → preview (key, title, status) → Link.
3. Status mapping in S7b: Taskuda To Do / In Progress / Done → Jira status for each (optional). With a mapping, status changes update Jira.
4. *Failure:* issue not found / no permission / token rejected → specific message (Section 8). Task still saves without the link.

### F13 — Install
1. Supported browser and not installed → InstallPrompt (dismissible) in app bar: "Install Taskuda" → browser install dialog.
2. *Alt:* dismissed → not shown again for 30 days; still available in S7g About.
3. New version deployed → toast "Taskuda updated. Reload to get the latest version." + "Reload".

---

## 3. Screen & State Inventory

Dialogs (D1–D7) are listed after the screens.

### S1 Welcome (first run, 3 steps)
| State | Spec |
|---|---|
| Default | Step indicator "1 of 3", step content, primary + skip actions |
| Loading | During Google consent/backup check: button spinner, label "Connecting…" |
| Empty | N/A — always has content |
| Error | Inline Alert under the step with the specific error + retry |
| Success | Step marked done, auto-advance; final step routes to S2 |

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

### S3 Task Editor (Dialog on ≥768px, bottom Sheet on <768px)
| State | Spec |
|---|---|
| Default | Fields: Title*, Company, Block, Start time, Duration, Notes, Jira link (if Jira connected); Save, Cancel; Delete (edit mode only) |
| Loading | Save button spinner (rarely visible) |
| Empty | Create mode: empty fields, title focused |
| Error | Inline field errors; save-failed toast with input kept |
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

### S6 Report
| State | Spec |
|---|---|
| Default | Scope Select, FormatSwitcher tabs, ReportPreview, Copy report |
| Loading | N/A — generated locally and instantly |
| Empty | No tasks for the scope: "Nothing to report yet." (Copy disabled) |
| Error | Clipboard blocked (F5.5) |
| Success | Copy button changes to "Copied" with a check for 2 s + aria-live announcement |

### S7 Settings (sections in a side nav on ≥1024px, list → subpage on smaller screens)
Sections: **S7a Companies, S7b Integrations, S7c Backup, S7d AI & Security, S7e Voice, S7f Stats, S7g About**.

| Section | Default | Loading | Empty | Error | Success |
|---|---|---|---|---|---|
| S7a Companies | List of CompanyChips with rename/recolor/delete; "Add company" | N/A (local) | "No companies yet. Add one to color-code your tasks." | Duplicate name inline error | Toast "Company saved" |
| S7b Integrations | IntegrationCards: Google Calendar, Jira; each with status + actions; Advanced (CR1) collapsed | Card spinner while connecting/testing | Not connected: description + "Connect" | Card Alert with reason + retry | "Connected" badge, last sync time |
| S7c Backup | Drive status, "Last backed up …", Back up now, Restore from Drive, Export / Import (CR2) | "Backing up…" | Not connected: "Your data is only on this device." + Connect | "Backup failed" + Try again | "Backed up just now" |
| S7d AI & Security | Provider, SecretField, model, Test key, Remove; Passphrase: "Change passphrase", "Reset secrets" | Test key spinner | No key: "No AI key added. AI recommendations are off." | Key rejected / test failed | "Key works" |
| S7e Voice | Voice on/off, reminder lead time (Off, 5, 10, 15 min), voice choice, "Play test" | N/A | N/A | Unsupported: "Your browser can't speak reminders. You'll still see them on screen." (controls disabled) | Test plays |
| S7f Stats | Three MetricTiles (M1, M2, M3) + one-line explanation each | N/A (local) | Before first closeout: "Your stats appear after your first closeout." | N/A — calculated locally; if logs can't be read, same as storage error on S2 | N/A |
| S7g About | Version, Install button (if available), Privacy summary, link to privacy page | N/A | N/A | N/A | N/A |

### Dialogs
| ID | Purpose | States |
|---|---|---|
| D1 Delete Task | "Delete this task?" Delete / Cancel | Default, Success (toast). No loading/empty/error: local action; failure → save-failed toast |
| D2 Timed-Task Move | "Move to Evening? This task starts at 2:00 PM." Remove time and move / Cancel | Default only (local) |
| D3 Delete Company | Company has tasks: "Remove company from tasks" / "Cancel". No tasks: simple confirm | Default, Success |
| D4 Restore Confirm | Version info, warning, Restore / Cancel | Default, Loading ("Restoring…"), Error (unreadable), Success (→ S2, toast "Restored backup from Oct 17, 9:14 PM") |
| D5 Unlock | Passphrase field, Unlock, "Restore without keys" | Default, Loading, Error (wrong passphrase), Success |
| D6 Set Passphrase | Passphrase + confirm + warning copy | Default, Error (mismatch / too short, min 8 chars), Success |
| D7 Link Jira Issue | Key/URL input → preview → Link | Default, Loading ("Looking up issue…"), Error (not found / no access / offline), Success (preview card) |

---

## 4. Information Architecture

```
App shell
├── S2 Today (home, "/")            ← default route; DayNavigator switches date ("/day/2026-10-19")
│   ├── S3 Task Editor (overlay)
│   ├── S5 Closeout (overlay, resumable)
│   └── D1, D2, D7 (overlays)
├── S6 Report ("/report", optional ?date=)
├── S7 Settings ("/settings/<section>")
│   └── S7a–S7g
└── S1 Welcome ("/welcome", first run only; redirects to "/" afterwards)
```

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
- **Toasts** appear at the top center, so they never cover the phone bottom action bar (changed during build).
- **Live regions:** status changes, task moves, "Copied", sync errors, and step changes in S5 are announced through a polite `aria-live` region.
- **Audio equivalents:** every spoken voice alert has a matching on-screen toast.
- **Touch targets:** ≥ 44×44 px (StatusToggle, note menu, tabs, FAB, swatches).
- **Motion:** with `prefers-reduced-motion`, drag animations, toasts, and step transitions use fades or no animation.
- **Forms:** every field has a visible label; errors are tied to fields with `aria-describedby` and appear on blur or submit.
- **Zoom:** usable at 200% browser zoom without loss of content.

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

### S3 Task Editor
| Element | Copy |
|---|---|
| Titles | New task · Edit task |
| Fields | Title · Company · Time of day · Start time (optional) · Duration (optional) · Notes (optional) · Jira issue (optional) |
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
| Done toast | Day closed. 3 tasks carried to tomorrow. |
| Already closed | You closed out today at 6:12 PM. — View report · Close out again |

### S6 Report
| Element | Copy |
|---|---|
| Scope | All companies · (company names) |
| Formats | Slack · Teams · Jira · Email |
| Report sections | Done · In progress · Carried to tomorrow |
| Copy button | Copy report → Copied |
| Empty | Nothing to report yet. Mark tasks done and they'll show up here. |
| Clipboard error | Couldn't copy automatically. The text is selected — press Ctrl+C (⌘C on Mac) to copy it. |

### S7 Settings
| Element | Copy |
|---|---|
| Section names | Companies · Integrations · Backup · AI & Security · Voice · Stats · About |
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
| Voice lines | "Up next at 2:00: Client call." · "Starting now: Client call." · Cheers (random): "Nice work." / "Done. On to the next." / "That's one off the list." |
| Stats | Tasks dropped without a decision · Closeout streak (working days) · Median time to report. Empty: Your stats appear after your first closeout. |
| About | Install Taskuda · Version (number) · Your data stays on your device and in your own Google Drive. Taskuda has no server that stores your tasks or keys. |
| Update toast | Taskuda updated. Reload to get the latest version. — Reload |
| Install prompt | Install Taskuda for one-click access. — Install · Not now |

### S1 Welcome
| Step | Copy |
|---|---|
| Intro | **Plan your day across every job.** Sticky notes for each employer, and a ready-to-send report at the end of the day. |
| Step 1 | **Add your first company** — Who do you work for? You can add more later. — Continue · Skip for now |
| Step 2 | **Back up to Google Drive** — Your tasks are saved on this device. Back them up to your own Drive so you never lose them. — Connect Google Drive · Not now. Error: Google sign-in was cancelled. You can connect later in Settings. — Try again · Skip |
| Step 3 | **Found a backup from Oct 17** — Restore it to pick up where you left off? — Restore · Start fresh |

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

---

## 10. Visual Direction (guidance for build)

- **Feel:** a calm desk with paper notes, not a dashboard. Warm off-white canvas (dark theme: deep warm charcoal), notes as soft-tinted paper cards with a subtle shadow and a company-color top edge.
- **Type:** one readable sans for UI; note titles slightly larger and heavier than metadata. Tabular numbers for times and stats.
- **Company palette:** 10 fixed hues (for example teal, coral, amber, violet, sky, rose, lime, indigo, orange, slate), each with a light note tint, a strong edge color, and dark-theme variants, all passing DAC11.
- **Status:** Done notes are desaturated with a struck-through title and a check (not dimmed with opacity, which would break text contrast); In Progress notes get a thicker top edge and a ◉ icon.
- **Light and dark themes,** following the system setting.
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

### Notes for the Software Engineer stage
These are engineering decisions the design depends on. They are noted here, not decided:
- Default model for each AI provider (S7d preset). **Decided:** Gemini `gemini-3.5-flash-lite` (Google's recommendation for new projects, Oct 2026); OpenRouter `openrouter/auto`. The model is a text field so users can change it without an app update.
- Which side wins when a task and its calendar event are both edited between syncs (PRD RK6).
- How many Drive backup versions to keep (PRD RK7). **Decided:** the newest 10, one file each in the hidden app-data folder. Google access tokens stay in memory only (no refresh token in a browser-only app): after a reload or after about an hour, backups resume silently when Google allows it, otherwise the indicator shows "Reconnect Google" and one click resumes them.
- Whether "Close out again" replaces or appends the day's closeout log entry for M2/M3 (design assumes replace). **Decided:** replace, keeping the first closeout's start/copy times for M3.
