# Changelog

All notable changes to Taskuda. Dates are UTC.

## [Unreleased]

Adds PRD FR30–FR34. Not yet deployed. Export a backup before deploying.

### Added
- **Due dates:** an optional due date and time on a task, shown on its note ("Due Fri, Oct 24"). Carried-over and restored tasks keep it; repeating tasks don't have one.
- **At-risk markers** on notes and in the closeout: Overdue, Overran, Running late (10 minutes after a To Do task's start), Due today and Stuck (carried over 3+ times). One marker per note, with no sounds or toasts.
- **Day summary row:** "4 of 9 done" and an "At risk" button that lists the day's at-risk tasks; choosing one opens it.
- **Stats M6:** deadlines met (tasks with a due date done on time, last 4 weeks).
- **Intro slides** on first run, with Skip on every slide, and "Show intro again" in Settings → About.
- **First-run setup** with three skippable steps: add several companies, set working days and the close-out reminder, then Drive backup. Setup resumes at its step after a closed tab. "I already use Taskuda" goes straight to restore.

- **Installable icons:** PNG app icons (192 and 512, also maskable), an iPhone home-screen icon, `favicon.ico`, and light and dark theme colours.
- **Search and AI visibility:** a static `/about/` page with FAQ and structured data, `llms.txt`, `pricing.md`, a social card image, and generated `robots.txt` and `sitemap.xml`. Indexing stays off until `SITE_INDEXING=on`.

### Security
- Restore and import now reject backups with malformed dates or times, which could crash Today, and vaults with an unsafe PBKDF2 iteration count.
- The Jira proxy logs refused requests (reason only, never the body or credentials) and refuses a declared oversized body before reading it.

### Changed
- **Database** version 5 (additive): `dueDate` and `dueTime` on tasks.
- **Backup format version 3** adds due dates. Version 1 and 2 backups and export files still restore and import.

## [0.2.0] — 2026-10-21

Adds PRD FR18–FR29 (the "My Work Day" additions). Not yet deployed. Export a backup before deploying (PRD RK16).

### Added
- **Undo delete** for 10 seconds, including the task's calendar event.
- **Working days** setting; carryover goes to the next working day, and the streak counts working days.
- **Report summary line** for all-company reports, and **time left** in the current block on today.
- **Close-out reminder** banner (5:30 PM by default), with a toast and spoken line when Taskuda is open.
- **Reminder actions:** Snooze 5 min, Snooze 15 min and Mark done on reminder toasts; Alt+T focuses the newest toast.
- **Quiet hours** for spoken alerts and eye-break prompts.
- **Overlap warnings** on notes and in the task editor.
- **Carry-over insights** in Stats: rate per company and overall, "Needs attention" callouts, tasks carried over 3+ times.
- **Eye-break reminders** with Done / Snooze 5 min, and a missed prompt shown once on return.
- **Daily time budget** with a gentle toast and banner; time in Taskuda on this device in Stats.
- **Stats M4 and M5:** eye breaks taken and days within the time budget.
- **Repeating tasks:** every day, every working day, weekly on chosen days, monthly on a date; "This task only" / "This and future tasks" for edits and deletes; repeats marker on notes.

### Changed
- **Database** versions 3 and 4 (additive): eye-break log and daily time in Taskuda (kept on this device only), repeating series, and `seriesId` on tasks.
- **Backup format version 2** adds repeating series. Version 1 backups and export files still restore and import.
- Toasts sit below the app bar so they no longer cover the day navigator.

## [0.1.0] — 2026-10-20

First complete build of v1 (PRD `docs/pm/taskuda-prd.md`). Not yet deployed.

### Added
- **Today canvas:** Morning / Afternoon / Evening blocks (tabs on phones), sticky notes tinted by company, three-state status toggle, task editor, note menu, drag-and-drop with keyboard support and spoken positions, day navigation (past days read-only), keyboard shortcuts `N T [ ] M ?`.
- **Companies** with ten accessible colours; deleting a company keeps its tasks.
- **Local-first storage** (IndexedDB) with an activity log; works offline as an installable PWA.
- **End-of-day closeout:** unfinished tasks must be carried over or deleted, 1–5 rating and reflection, AI recommendations step, report step; resumable draft; carryover to the next day.
- **Report builder:** all companies or one, Slack / Teams / Jira / email formats, one-click copy with manual fallback.
- **Local stats:** tasks dropped without a decision, weekday closeout streak, median time to report.
- **Encrypted secrets:** passphrase once per device, masked key display, change passphrase, reset.
- **AI recommendations** with your own Gemini or OpenRouter key, data disclosure before the first request.
- **Google Drive backup:** automatic, last 10 versions kept, restore with other-device warning and passphrase unlock or "Restore without keys"; export/import a backup file.
- **First-run welcome**, settings layout (side nav on desktop, list on phones), About, install prompt, update toast.
- **Google Calendar two-way sync** (later edit wins), with the option to use your own Google client ID.
- **Voice:** spoken "Up next" / "Starting now" reminders, completion cheer, missed-reminder catch-up, voice settings.
- **Jira:** proxy function, connect with your API token, link issues to tasks, status mapping.

### Security
- Strict Content Security Policy and security headers in `vercel.json`.
- `shadcn` moved to devDependencies; production dependencies have no known vulnerabilities (see implementation notes for the dev-tooling waiver).
