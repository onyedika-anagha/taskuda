# Taskuda — Product Requirements Document

**Track:** A (new project, multiple third-party integrations)
**Status:** Definition of Ready — passed with waiver W1 (see Section 9)
**Owner:** umpiremed@gmail.com
**Last updated:** 2026-10-20

### Revision history
| Date | Change |
|---|---|
| 2026-10-18 | First version. Definition of Ready passed. |
| 2026-10-20 | Added FR18–FR29, M4–M5 and RK11–RK16. These were adopted from the external "My Work Day" PRD after checking them against the built v1, and are in v1 launch scope as Should. Changed AC11.1 so carryover goes to the next **working** day. Ideas that conflict with Taskuda's scope are listed in Out of Scope (items 13–22). |

---

## 1. Problem Statement & Opportunity

### Who
The **"Parallel Professional"**: one person working for several employers or clients at the same time (for example, two part-time jobs and a freelance client). This person usually has to send end-of-day (EOD) reports to more than one of them.

### What's broken
- Tasks for different employers live in different places, or only in the person's head. There is no single view of "what am I doing today, for whom".
- Unfinished tasks get **silently dropped**: they are not done, not moved to tomorrow, and nobody notices until later.
- Writing EOD reports is manual. The person rebuilds the day from memory and from Slack, Jira, or Calendar history, then rewrites it separately for each employer.
- Existing task apps are either too heavy (team project tools) or don't understand "one person, many employers" (personal to-do apps).
- Repeating work (a daily standup note, a weekly client update, a monthly report) has to be typed in again every time, or it gets forgotten.
- Long, unbroken screen sessions strain the eyes. Nothing reminds the person to look away, and they have no sense of how long they've spent in the planner itself.

### Why now
The owner is currently juggling several roles and feels this pain every day. Taskuda is a free, non-commercial personal tool. It costs nothing to run because each user brings their own storage (Google Drive) and their own AI key.

### Falsifiable claim
If Taskuda works, the owner will use it every working day for 4 straight weeks, will not silently lose any task, and will produce an EOD report in 5 minutes or less. If any of those fail, the product has not solved the problem.

---

## 2. Goals & Success Metrics

| # | Metric | Baseline | Target | How it is measured |
|---|--------|----------|--------|--------------------|
| M1 | **Task retention**: share of tasks that disappear with no recorded outcome (not Done, not carried over, not deleted on purpose) | Not measured today (current workflow has no record) | **0%** over a 4-week window | Local activity log in the app. Every task that is not Done at closeout must have exactly one outcome: carried over, or deleted by the user. |
| M2 | **Adoption**: consecutive working days with a completed EOD closeout | 0 days (app does not exist) | **20 consecutive working days** (4 weeks, Mon–Fri) | Local closeout log. One entry per completed closeout. |
| M3 | **EOD reporting time**: time from "Start closeout" to "Report copied" | Waived (see Waiver W1) | **Median ≤ 5 minutes** over the 4-week window | Two timestamps saved locally for each closeout. |
| M4 | **Eye-break follow-through**: share of eye-break prompts the user confirms with "Done" | 0% (no eye-break prompts exist today) | **≥ 70%** over the 4-week window, while eye breaks are on | Local log of each prompt shown and how it ended (Done, snoozed, dismissed, or missed). |
| M5 | **In-app time budget**: share of working days where time spent in Taskuda stays within the user's daily budget | Not measured today (no in-app time is recorded) | **≥ 80% of working days** over the 4-week window, while a budget is set | Local daily total of the time Taskuda is visible on screen on this device. |

**Measurement constraint:** there is no analytics server. All metrics are calculated on the user's device from the local activity log. The app shows them on a simple stats view in Settings, so the owner can read them without any external tool.

---

## 3. Scope

### In Scope (v1)
1. Sticky-note task canvas grouped into **Morning / Afternoon / Evening** blocks
2. Companies/employers with **color tags**, applied to tasks
3. **3-state task toggle**: To Do → In Progress → Done
4. Manual task creation, editing, and deletion
5. **Local-first storage** in the browser, working offline
6. **Google Drive backup and restore** of the user's data
7. **Google Calendar two-way sync** (tasks ↔ events)
8. **Voice notification engine**: pre-task reminder, start alert, completion cheer
9. **EOD closeout flow**: guided reflection, completion rating, carryover of unfinished tasks to the next day
10. **AI EOD recommendations** using the user's own AI key (Gemini or OpenRouter)
11. **Report builder** with one-click copy, formatted for Slack, Teams, Jira, and email
12. **Jira integration**: link a task to a Jira issue and sync supported fields
13. Installable **PWA** (Progressive Web App)
14. Local metrics view (M1–M5)
15. **Undo** a deleted task for 10 seconds
16. **Configurable working days** (default Monday–Friday)
17. **Recurring tasks**: every day, every working day, weekly on chosen weekdays, monthly on a date
18. **Closeout nudge** at a set time on working days
19. **Snooze** and **Mark done** directly from a reminder
20. **Quiet hours** for spoken alerts and eye-break prompts
21. **Summary line** at the top of the all-companies report
22. **Overlap warning** when timed tasks clash
23. **Carry-over insights** per company in Stats
24. **Time left** in the current time block
25. **Eye-break reminders** at a set interval during set hours
26. **In-app time budget** with a gentle warning (no lock)

### Out of Scope (v1)
1. Asana and Trello sync (v2)
2. 7-day weekly review dashboard (v2)
3. AI pattern detection across multiple weeks (v2)
4. **Multi-device conflict resolution.** v1 assumes one primary device. Drive is used as backup/restore, not live multi-device sync. (v2)
5. PDF export (v2)
6. User accounts, a central server database, or any server that stores user data
7. Team or shared workspaces. Taskuda is single-user.
8. Paid plans, billing, or any commercial use
9. Native mobile apps (iOS/Android app stores)
10. Calendar sync while the app is closed (background/push sync)
11. Jira OAuth 2.0 login (v1 uses a personal API token; see Section 5)
12. Sending reports directly to Slack/Teams/Jira/email. v1 copies to the clipboard only.
13. Removing the delete confirmation (D1). Undo is added after it; the confirmation stays.
14. Undo for status changes. The status toggle already goes back from Done to To Do.
15. Recurrence patterns other than the four in FR20 (for example "every 3 days" or "second Tuesday of the month"), and end dates for a series.
16. Suggesting a free time slot when tasks overlap. FR25 only warns.
17. Locking the app when the time budget is used up. FR29 is a warning only.
18. Measuring screen time outside Taskuda (other apps, the whole device, or the phone's own screen-time data).
19. Changing the time-block ranges (Morning 05:00–11:59, Afternoon 12:00–16:59, Evening 17:00–04:59).
20. A warning for over-filled blocks. With blocks this long, it would almost never trigger.
21. Eye-break or reminder alerts while the browser is closed or the device is asleep (same limit as item 10).
22. Teams, shared workspaces, time tracking, invoicing and a template marketplace, as proposed in the My Work Day PRD (see items 6–8).

---

## 4. Requirements

### 4.1 Functional requirements (user stories)

| ID | User story |
|----|------------|
| FR1 | As a Parallel Professional, I want to see today's tasks as sticky notes in Morning, Afternoon, and Evening blocks, so I can see my whole day at a glance. |
| FR2 | As a user, I want to create, edit, and delete a task (title, optional notes, time block, optional start time, optional duration, company), so I can capture work quickly. |
| FR3 | As a user, I want to move a task between time blocks and reorder it within a block, so my plan matches reality as the day changes. |
| FR4 | As a user, I want to set each task's status (To Do → In Progress → Done) with one control, so I can track progress without extra steps. |
| FR5 | As a user, I want to create companies/employers, each with a name and a color, and tag tasks with one company, so I can tell at a glance whose work a task is. |
| FR6 | As a user, I want my data saved on my device immediately and the app to work offline, so I never lose work because of a bad connection. |
| FR7 | As a user, I want to connect my Google Drive and have my data backed up there automatically, and restore it on a new or reset device, so my data is safe and owned by me. |
| FR8 | As a user, I want tasks with a start time to appear as events in my Google Calendar, and events in a calendar I choose to appear as tasks, so I don't have to enter things twice. |
| FR9 | As a user, I want spoken reminders before a task starts, when it starts, and a short cheer when I complete it, so I stay on schedule without watching the screen. |
| FR10 | As a user, I want a guided end-of-day closeout that asks me to reflect, rate my day, and decide what happens to every unfinished task, so nothing gets silently dropped. |
| FR11 | As a user, I want unfinished tasks I choose to carry over to appear on the next day automatically, so tomorrow starts with what's left from today. |
| FR12 | As a user, I want to enter my own Gemini or OpenRouter API key, protected by a passphrase, so I can use AI features without Taskuda paying for or seeing my key. |
| FR13 | As a user, I want AI recommendations during closeout about what slowed me down and what to change tomorrow, so I improve over time. |
| FR14 | As a user, I want to generate an EOD report (all companies, or one company) and copy it in Slack, Teams, Jira, or email format with one click, so reporting takes minutes. |
| FR15 | As a user, I want to connect Jira with my API token, link a task to a Jira issue, and see the issue's key, title, and status on the task, so my task list and Jira agree. |
| FR16 | As a user, I want to install Taskuda on my desktop or phone like an app, so it's one click away. |
| FR17 | As a user, I want to see my M1–M5 metrics in Settings, so I can tell whether Taskuda is actually helping. |
| FR18 | As a user, I want to undo a delete for a few seconds, so a wrong tap doesn't lose a task. |
| FR19 | As a user, I want to choose which weekdays I work, so my streak, my carryover and my nudges follow my real week. |
| FR20 | As a user, I want to make a task repeat (every day, every working day, weekly on chosen days, or monthly on a date), so repeating work shows up without retyping it. |
| FR21 | As a user, I want a reminder at a time I choose to close out my day if I haven't yet, so I don't skip the closeout and lose my streak. |
| FR22 | As a user, I want to snooze a task reminder or mark the task done straight from the reminder, so I can deal with it in one tap. |
| FR23 | As a user, I want to set quiet hours when Taskuda doesn't speak or show eye-break prompts, so it doesn't interrupt meetings or my evening. |
| FR24 | As a user, I want the all-companies report to start with a one-line summary of the day, so the reader sees the totals first. |
| FR25 | As a user, I want to be warned when two timed tasks overlap (including imported meetings), so I notice a clash before the day starts. |
| FR26 | As a user, I want to see which company's tasks I carry over most, and which tasks keep getting carried over, so I know where my planning is unrealistic. |
| FR27 | As a user, I want to see how much time is left in the current time block, so I can pace myself without working it out. |
| FR28 | As a user, I want a reminder to rest my eyes at a set interval during my working hours, so long screen sessions strain my eyes less. |
| FR29 | As a user, I want to set a daily budget for time spent in Taskuda and get a gentle warning when I go over, so I notice when planning itself is eating my day. |

### 4.2 Non-functional requirements

| ID | Requirement |
|----|-------------|
| NFR1 | **Offline:** after the first load, every feature except Drive, Calendar, AI, and Jira works with no network connection. |
| NFR2 | **Durability:** every task change is saved locally within 1 second. A browser refresh or crash loses no saved change. |
| NFR3 | **Performance:** the app shell loads in under 2 seconds on a repeat visit (from cache) on a mid-range laptop. Dragging a sticky note stays smooth with 50 tasks on screen. |
| NFR4 | **Privacy:** no user data (tasks, reports, keys, tokens) is ever sent to a server run by Taskuda, except Jira requests passing through the Jira proxy (see NFR6). The proxy must not store or log request bodies or tokens. |
| NFR5 | **Key security:** AI keys and the Jira API token are stored only in encrypted form, locally and in Drive. Keys are sent only to their own provider (Gemini, OpenRouter, Atlassian). |
| NFR6 | **Proxy restrictions:** the Jira proxy only forwards to `*.atlassian.net`, only accepts requests from Taskuda's own domain, and limits the request rate per client. |
| NFR7 | **Least-privilege Google scopes:** Drive uses only `drive.appdata` (or `drive.file`). Calendar uses only event-level scope. Full `drive` scope is never requested. |
| NFR8 | **Accessibility:** WCAG 2.1 AA. Every action that uses drag-and-drop also has a keyboard or button alternative. |
| NFR9 | **Browser support:** full support on current Chrome and Edge (desktop and Android). Firefox and Safari are best-effort. Voice features may be limited there, and the app must say so instead of failing silently. |
| NFR10 | **Cost:** running Taskuda costs the owner $0/month beyond an existing domain. |

---

## 5. Constraints & Assumptions

### Constraints (decided)
- **Stack:** React + TypeScript + Vite, Tailwind CSS + shadcn/ui, @dnd-kit, Zustand, Dexie (IndexedDB), React Hook Form + Zod, date-fns, Lucide, Vitest + React Testing Library, Playwright.
- **Hosting:** Vercel Hobby (free, non-commercial). Served on a **subdomain of a domain the owner already owns** (for example `taskuda.<owner-domain>`).
- **No central database.** Storage is on-device (IndexedDB) first, with Google Drive (`drive.appdata`) as backup.
- **Google sign-in:** uses the owner's Google Cloud OAuth client ID. An optional **"bring your own Google client ID"** setting is a Could-have (CR1).
- **Google OAuth in the browser only:** there is no refresh token, so access tokens expire about every hour and must be silently renewed. Calendar sync only runs while the app is open.
- **AI:** bring-your-own-key (BYOK) for Gemini and OpenRouter, called directly from the browser.
- **Key unlocking:** the user sets a passphrase once per device. After that, a non-exportable key kept in the browser unlocks secrets on that device. A forgotten passphrase means re-entering the AI key and Jira token; nothing else is lost.
- **Jira:** personal API token (no OAuth in v1), encrypted like the AI key, sent through **one Vercel serverless function acting as a proxy** (browsers block direct calls to Jira).
- **Voice:** Web Speech API, so quality and availability depend on the browser.
- **Cost:** $0 extra. No paid services.
- **Data format changes (FR18–FR29):** recurring rules, eye-break events and daily in-app time are new kinds of local data. The local database and the backup file format both get a new version. Older backups and export files (format version 1) must still restore. Whether eye-break and in-app time data are backed up or kept on one device only is an engineering decision; record it in the implementation notes.
- **Alerts only run while Taskuda is open:** eye breaks, the closeout nudge and snoozed reminders use the same engine as FR9, so they can't fire while the browser is closed or the device is asleep (Out of Scope item 21).

### Assumptions
- v1 launches in **Google OAuth testing mode** (up to 100 test users), because the owner is the first and main user. Going public requires Google's free app review (privacy policy page, homepage, demo video, Search Console domain verification). That is a separate milestone after v1, not a v1 requirement.
- The user has a Google account and is willing to connect Drive and Calendar.
- The user has their own Gemini or OpenRouter account and pays for their own AI usage.
- The user uses Jira Cloud (`*.atlassian.net`), not Jira Server/Data Center.
- Build time is part-time, alongside other projects and a job search.

### Dependencies
- Google Drive API v3, Google Calendar API v3 (free, quota-limited)
- Gemini API and OpenRouter API (user-paid)
- Jira Cloud REST API
- Vercel Hobby plan terms (non-commercial use only)

---

## 6. Risks

| # | Risk | Impact | Mitigation | Owner |
|---|------|--------|------------|-------|
| RK1 | **Schedule:** all v1 features at launch with no dedicated build time | Launch slips for months | Build Musts first, then Shoulds. If M-features are done but S-features slip past 2026-12-31, the owner decides between launching without the slipped feature and waiting. | Owner |
| RK2 | **Web Speech API reliability** varies by browser, and reminders may not fire when the phone is locked or the tab is in the background | Missed reminders | NFR9: detect support and tell the user. Catch-up on resume: missed reminders are shown when the app comes back. Never promise lock-screen alerts. | Owner |
| RK3 | **Client-side key handling:** an AI key in the browser can be exposed by malicious scripts (XSS) or by a compromised dependency | User's AI account abused | Encrypted at rest (NFR5), strict Content Security Policy, minimal dependencies, Security stage review. Recommend users set spending limits on their AI provider account. | Owner (Security stage) |
| RK4 | **Jira proxy abuse:** used as an open proxy | Vercel limits hit, project paused | NFR6 restrictions. Monitor Vercel usage. | Owner |
| RK5 | **Google testing-mode limits:** 100 users max, "unverified app" warning, hourly token renewal | Friction; can't go public | Accepted for v1 (personal use). Public review is a post-v1 milestone. | Owner |
| RK6 | **Calendar sync conflicts / duplicates** (same item edited in both places) | Duplicate or wrong events | Stable task↔event mapping. A clear rule for which side wins, set in the design/engineering stages. Tested with automated tests. | Owner |
| RK7 | **Data loss:** browser storage cleared, or a bad backup overwrites a good one | User loses tasks | Automatic Drive backup. Keep previous backup versions. Restore always asks for confirmation. | Owner |
| RK8 | **Multi-device use** (out of scope) happens anyway | Data overwritten between devices | Restore warns when the backup came from a different device. Full conflict handling is v2. | Owner |
| RK9 | **Vercel Hobby terms change**, or a commercial use case appears | Hosting must move | Static app; can move to Cloudflare Pages or shared hosting without code changes (except the proxy). | Owner |
| RK10 | **Domain/DNS hygiene:** the subdomain's DNS record left pointing at a removed Vercel project, or the Search Console verification left unwatched | Subdomain takeover | Remove the DNS record if the project is deleted. Review Search Console access during the Security stage. | Owner (Security stage) |
| RK11 | **Launch slips** because FR18–FR29 were added to v1 after the rest of v1 was built | The 4-week measurement (M1–M3) starts later | Build in this order: FR18, FR19, FR24, FR27, FR21, FR22, FR23, FR25, FR26, FR28, FR29, FR20. The RK1 decision rule (launch without a slipped Should, or wait) applies to each one. | Owner |
| RK12 | **Recurring tasks clash with carryover**, for example a daily task carried from yesterday plus today's new occurrence | Duplicate tasks; reports and M1 counts are wrong | AC20.4: a day never gets a new occurrence when a carried-over copy from the same series is already on it. Occurrences are never created on past days (AC20.3). Covered by automated tests. | Owner |
| RK13 | **Alert fatigue**: reminders, eye breaks, the nudge and budget warnings together become noise, and the user turns all of them off | Voice reminders (FR9) stop helping | Every alert type has its own off switch. Quiet hours (FR23). At most one closeout nudge a day (AC21.3). Budget warnings repeat at most once per extra hour (AC29.3). | Owner |
| RK14 | **Eye-break timing is unreliable** when the tab is in the background or the device sleeps | Breaks are late or missed; M4 is understated | Never promise alerts when the browser is closed. A prompt missed in the background shows once when the user comes back, and is logged as missed, not as a failure to follow through (AC28.5). | Owner |
| RK15 | **The in-app time number is mistaken for total screen time** | The user trusts a number that leaves out every other app | The copy always says "time in Taskuda on this device" (AC29.5). Device-wide screen time is out of scope (item 18). | Owner |
| RK16 | **Database or backup migration breaks existing data** when the new data types are added | Data loss for the owner, who is already using the app | Additive changes only. Restoring and importing a format-1 backup is tested (AC20.7). Export a backup before deploying. | Owner |
| RK11 | **Jira API tokens (found during build, 2026-10-19):** Atlassian's docs say apps that collect API tokens don't meet its security requirements and recommend OAuth 2.0 (3LO) or Forge. Acceptable for personal use with the user's own token, not for a public release. | Blocks a public launch of the Jira feature | Keep the token encrypted (NFR5), the proxy locked down (NFR6). Before going public, move Jira to OAuth 2.0 (3LO) or flag the Jira feature off. | Owner (Security stage) |

---

## 7. Prioritization (MoSCoW)

All Must and Should items are **in v1 launch scope**. "Should" means it is built after the Musts and is the first candidate for a launch decision if RK1 happens.

| Priority | Requirements |
|----------|--------------|
| **Must** | FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR10, FR11, FR12, FR13, FR14, FR16, FR17, NFR1–NFR10 |
| **Should** | FR8 (Calendar sync), FR9 (voice engine), FR15 (Jira), FR18–FR29 (added 2026-10-20; built in the RK11 order) |
| **Could** | CR1: "Bring your own Google client ID" setting. CR2: manual export/import of all data as a file. |
| **Won't (v1)** | Everything in Section 3 "Out of Scope" |

---

## 8. Acceptance Criteria

Each criterion must be verifiable by someone other than the owner.

**FR1 — Time-block canvas**
- AC1.1 The Today view shows three labeled blocks: Morning, Afternoon, Evening.
- AC1.2 Each task appears as a sticky note in exactly one block.
- AC1.3 With zero tasks, each block shows an empty state (not a blank area).

**FR2 — Task create/edit/delete**
- AC2.1 A task can be created with only a title. All other fields are optional, and the block defaults to the current time of day.
- AC2.2 Edits appear on the note immediately and survive a page refresh.
- AC2.3 Deleting asks for confirmation, and the deletion is recorded in the activity log (it counts as an outcome for M1).

**FR3 — Move and reorder**
- AC3.1 A task can be dragged to another block or to another position within a block, and the new position survives a refresh.
- AC3.2 The same move can be done without a mouse (keyboard or menu), per NFR8.

**FR4 — 3-state toggle**
- AC4.1 One control cycles To Do → In Progress → Done.
- AC4.2 Each status looks visibly different and is not shown by color alone.
- AC4.3 Every status change is saved with a timestamp in the activity log.

**FR5 — Companies and colors**
- AC5.1 A user can create, rename, recolor, and delete a company.
- AC5.2 A task tagged with a company shows that company's color and name.
- AC5.3 Deleting a company that still has tasks asks what to do with those tasks, and never deletes them silently.

**FR6 — Local-first and offline**
- AC6.1 With the network disabled (after the first load), the user can create, edit, move, and complete tasks and run the closeout without AI.
- AC6.2 A change made and followed by a forced browser close within 1 second is still there on reopen (NFR2).

**FR7 — Google Drive backup/restore**
- AC7.1 After connecting Drive, a backup file appears in the app's Drive app-data area within 1 minute of a change while online.
- AC7.2 On a fresh browser profile, connecting the same Google account and choosing Restore brings back all tasks, companies, and settings.
- AC7.3 The OAuth consent screen asks only for the scopes in NFR7.
- AC7.4 Restore asks for confirmation before replacing local data, and warns if the backup came from a different device.

**FR8 — Google Calendar two-way sync**
- AC8.1 A task with a start time creates an event in the user's chosen calendar within 1 minute while the app is open.
- AC8.2 Changing the task's title or time updates that same event (no duplicate is created).
- AC8.3 A new event in the chosen calendar appears as a task on the right day and in the right block within 1 minute of the next sync while the app is open.
- AC8.4 Deleting on one side removes it on the other.
- AC8.5 Running sync twice in a row with no changes creates no duplicates.

**FR9 — Voice engine**
- AC9.1 On supported browsers, a spoken reminder plays N minutes before a task's start time (N set by the user, default 5).
- AC9.2 A spoken alert plays at the start time, and a short spoken cheer plays when a task is marked Done.
- AC9.3 Voice can be turned off globally.
- AC9.4 On an unsupported browser, Settings shows a message that voice is not available.
- AC9.5 If the app was in the background or closed when a reminder was due, the missed reminder is shown when the app is opened again.

**FR10 — EOD closeout**
- AC10.1 The closeout cannot be finished until every task that isn't Done has an outcome: carry over, or delete.
- AC10.2 The closeout records a reflection (free text, optional) and a day rating from 1 to 5 (required).
- AC10.3 Finishing the closeout saves a closeout log entry with start and finish timestamps (for M2 and M3).

**FR11 — Carryover**
- AC11.1 Tasks marked "carry over" appear on the next **working day** (FR19) in the same block, still To Do or In Progress, with a visible "carried over" marker. With the default working days, a task carried over on Friday appears on Monday. *(Changed 2026-10-20; was "the next day".)*
- AC11.2 A task carried over more than once shows how many times it was carried.

**FR12 — BYOK AI key**
- AC12.1 The user can add, replace, and remove a key for Gemini and for OpenRouter.
- AC12.2 The key is never shown in full after saving (only the last 4 characters).
- AC12.3 Inspecting IndexedDB and the Drive backup file shows no readable key, only encrypted data.
- AC12.4 A passphrase is required once per device. After a browser restart on the same device, AI works without re-entering it.
- AC12.5 With a wrong passphrase the key stays locked and the app says so, and there is an option to reset and re-enter the key.
- AC12.6 Network logs show the key sent only to the selected provider's domain.

**FR13 — AI recommendations**
- AC13.1 During closeout, with a key set and the network on, the user gets recommendations based on that day's tasks, statuses, carryovers, and reflection.
- AC13.2 With no key, no network, or a provider error, the closeout can still be finished, and the app explains why recommendations are missing.
- AC13.3 Before the first AI request, the user is told which data will be sent to the provider.

**FR14 — Report builder**
- AC14.1 The user can create a report for all companies or for one company.
- AC14.2 Four formats are available: Slack, Teams, Jira, email. Pasting each into its target shows correct formatting (lists, bold, line breaks).
- AC14.3 One click copies the report to the clipboard and shows a confirmation, and that time is recorded for M3.
- AC14.4 The report lists Done tasks, In Progress tasks, and carried-over tasks for the chosen scope.

**FR15 — Jira**
- AC15.1 The user can save a Jira site URL, email, and API token. The token is encrypted like the AI key (AC12.3).
- AC15.2 The user can link a task to an issue by key or URL, and the task shows the issue key, title, and current status.
- AC15.3 Changing a linked task's status updates the issue's status, if the user has mapped the statuses.
- AC15.4 The proxy rejects any target outside `*.atlassian.net` and any request from another origin (NFR6).

**FR16 — Installable PWA**
- AC16.1 Chrome/Edge offers "Install", and the installed app opens in its own window.
- AC16.2 A new release is picked up within one reload after deployment.

**FR17 — Local metrics view**
- AC17.1 Settings shows M1 (silently-dropped count), M2 (current streak of consecutive closeouts on working days), and M3 (median minutes from closeout start to report copy), calculated from local logs.
- AC17.2 Settings shows M4 (share of eye-break prompts marked Done in the window) when eye breaks are on, and M5 (share of working days within budget in the window) when a budget is set. When the feature is off, its tile says it is off instead of showing 0%.

**FR18 — Undo delete**
- AC18.1 After a task is deleted (D1 confirmed), a toast offers **Undo** for 10 seconds.
- AC18.2 Undo brings the task back with the same title, notes, company, day, block, position, start time, duration, status, carryover count and Jira link.
- AC18.3 The activity log records the deletion and then the restore, so a restored task is not counted as deleted for M1.
- AC18.4 If the task had a calendar event, the event is deleted as in AC8.4, and an undone task gets an event again at the next sync, with no duplicate.
- AC18.5 The Undo button can be reached with the keyboard and is announced to screen readers.

**FR19 — Working days**
- AC19.1 Settings lets the user choose any set of weekdays as working days. The default is Monday to Friday. At least one day must stay selected.
- AC19.2 The M2 streak skips non-working days. For example, with Saturday added as a working day, a missed Saturday closeout breaks the streak.
- AC19.3 Carryover goes to the next working day (AC11.1).
- AC19.4 The closeout nudge (FR21), eye breaks (FR28) and the "every working day" repeat (FR20) only run on working days.

**FR20 — Recurring tasks**
- AC20.1 In the task editor the user can set Repeat to: Doesn't repeat (default), Every day, Every working day, Weekly on (one or more weekdays), or Monthly on (a day of the month). For days 29–31, months without that date use their last day.
- AC20.2 A repeating task appears on today and on future days that match, with a visible "repeats" marker.
- AC20.3 Occurrences are never created on past days. A day the user never opened in Taskuda has no occurrence, so nothing is counted as dropped for M1.
- AC20.4 A day never shows two copies from the same series: if a carried-over copy from the series is already on that day, no new occurrence is added.
- AC20.5 Editing an occurrence asks "This task only" or "This and future tasks". Deleting asks "This task only" or "This and future tasks" (which stops the series). Changes never touch past days.
- AC20.6 With calendar sync on, each occurrence with a start time becomes its own event, and running sync twice creates no duplicates (AC8.5).
- AC20.7 Series are included in the Drive backup and in export files. Restoring or importing a backup made before this feature still works.

**FR21 — Closeout nudge**
- AC21.1 Settings has a nudge time (Off, or a time of day; default 5:30 PM).
- AC21.2 On a working day, if today is not closed out by the nudge time and Taskuda is open, Taskuda shows a banner on Today with a **Close out day** button and a toast, and speaks one line if voice is on and it's not quiet hours.
- AC21.3 It nudges at most once per day. Dismissing the banner hides it until the next working day. Closing out removes it.
- AC21.4 If Taskuda wasn't open at the nudge time, the banner shows when it's opened later that day, without the toast or voice line.

**FR22 — Snooze and Mark done from a reminder**
- AC22.1 The "Up next" and "Starting now" toasts have **Snooze 5 min**, **Snooze 15 min** and **Mark done**.
- AC22.2 Snoozing repeats the same reminder (toast, and voice if on) after the chosen time, while Taskuda is open.
- AC22.3 Mark done sets the task to Done exactly like the status toggle (activity log, cheer, Jira mapping).
- AC22.4 Reminder toasts with actions stay on screen until the user acts or closes them; they don't disappear on a timer.

**FR23 — Quiet hours**
- AC23.1 Settings lets the user set quiet hours as a start and end time (off by default). The range can cross midnight, for example 10:00 PM to 7:00 AM.
- AC23.2 During quiet hours nothing is spoken, and eye-break prompts are not shown. Task reminder toasts and the nudge banner still show.
- AC23.3 Eye-break prompts skipped because of quiet hours are not counted in M4.

**FR24 — Report summary line**
- AC24.1 An all-companies report starts with one summary line with counts of done, in progress and carried-over tasks, and the number of companies, for example "8 done · 3 in progress · 2 carried to tomorrow, across 3 companies".
- AC24.2 The line appears in all four formats (Slack, Teams, Jira, email) and the numbers match the sections below it.
- AC24.3 Single-company reports have no summary line.

**FR25 — Overlap warning**
- AC25.1 Two tasks on the same day overlap when both have a start time and their time ranges cross. A task with no duration counts as 30 minutes, the same as its calendar event. Done tasks are ignored.
- AC25.2 Each overlapping note shows an "Overlaps with (other task title)" marker, using an icon and text, not color alone.
- AC25.3 Saving a task whose time overlaps another shows a warning in the editor, but the save is not blocked.
- AC25.4 Tasks imported from the calendar are included.

**FR26 — Carry-over insights**
- AC26.1 Stats shows the carry-over rate for each company and overall: the share of tasks on past days in the 4-week window that were carried over.
- AC26.2 A company with at least 5 tasks in the window and a rate of 30% or more gets a "Needs attention" callout naming it, for example "Acme: 40% of tasks carried over in the last 4 weeks."
- AC26.3 Stats lists open tasks that have been carried over 3 times or more, with their titles and companies.
- AC26.4 The numbers come from local data only. With no past tasks in the window, the section shows an empty state.

**FR27 — Time left in the block**
- AC27.1 On today, the header of the current block shows the time left in it, for example "1 h 20 min left", for Morning and Afternoon. Evening shows no countdown because it runs past midnight.
- AC27.2 The value updates at least once a minute and moves to the next block when the block ends.
- AC27.3 Other days show no countdown.

**FR28 — Eye-break reminders**
- AC28.1 Settings has eye breaks on or off (default off), an interval (20, 30, 45 or 60 minutes; default 20) and eye-break hours (default 9:00 AM to 5:00 PM).
- AC28.2 On working days, during eye-break hours and while Taskuda is open, a prompt appears after each interval, counted from the last prompt, with **Done** and **Snooze 5 min**. It speaks one line if voice is on.
- AC28.3 Each prompt's outcome (Done, snoozed, dismissed, or missed) is saved to the local log used for M4.
- AC28.4 Eye-break prompts follow quiet hours (AC23.2).
- AC28.5 A prompt that came due while Taskuda was in the background shows once when the user comes back and is logged as missed. Prompts never pile up.

**FR29 — In-app time budget**
- AC29.1 Taskuda records how long it is visible on screen each day on this device. Time with the tab hidden or the window minimized doesn't count.
- AC29.2 Settings has a daily budget: Off (default), 1, 2, 3 or 4 hours.
- AC29.3 When today's total passes the budget, Taskuda shows one gentle toast and a dismissible banner. It warns again at most once per extra hour. Nothing is locked or blocked.
- AC29.4 Stats shows today's time in Taskuda and the 7-day average.
- AC29.5 Every place that shows this number says it is time in Taskuda on this device, not total screen time.

**Non-functional checks**
- NFR3: measured with Lighthouse or the browser performance tools on a repeat visit.
- NFR8: automated accessibility check (for example axe) shows no WCAG 2.1 AA violations on the main screens.
- NFR10: the Vercel dashboard shows the Hobby plan with no paid add-ons.

---

## 9. Definition of Ready

- [x] Problem statement is specific and falsifiable (Section 1, "Falsifiable claim")
- [x] At least one success metric is quantified with a baseline and target (M2: 0 → 20 consecutive working days; M1: target 0%)
- [x] Scope has explicit Out-of-Scope items (Section 3)
- [x] Every requirement has at least one acceptance criterion (Section 8)
- [x] Requirements are prioritized and not everything is a Must (Section 7)
- [x] Risks section is non-empty (Section 6)
- [x] No placeholder text remains
- [x] File is committed at `docs/pm/taskuda-prd.md`

Re-checked on 2026-10-20 after adding FR18–FR29: each one has acceptance criteria (Section 8), a priority (Section 7) and risks (RK11–RK16). The new metrics M4 and M5 have a baseline and a target. Items cut from the My Work Day ideas are listed in Out of Scope.

### Waiver W1: M3 baseline (current EOD reporting time)
Reason: The owner chose not to provide a baseline number. The target (median ≤ 5 minutes) is an absolute target and can be measured without a baseline, but the improvement can't be stated as a before/after reduction.
Owner: umpiremed@gmail.com
Revisit by: Post-launch review (end of the 4-week measurement window). Optionally time 3 manual EOD reports before switching to Taskuda.
