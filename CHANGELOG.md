# Changelog

All notable changes to Taskuda. Dates are UTC.

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
