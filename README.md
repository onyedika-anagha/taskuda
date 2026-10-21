# Taskuda

A free, local-first planner for people who work for several employers or clients at once. Plan the day as sticky notes in Morning / Afternoon / Evening, colour-coded by company, then close out the day and copy a ready-made end-of-day report for Slack, Teams, Jira or email.

- **Your data stays yours.** Everything is stored in the browser (IndexedDB) and, if you connect it, backed up to a hidden folder in your own Google Drive. There is no Taskuda server or database.
- **Bring your own AI key.** Gemini or OpenRouter, called straight from the browser and stored encrypted.
- **Optional integrations:** Google Calendar two-way sync, spoken reminders, Jira issue links.
- **Installable PWA** that works offline.

Product and design docs: [PRD](docs/pm/taskuda-prd.md) · [Design spec](docs/design/taskuda-design-spec.md) · [Implementation notes](docs/engineering/taskuda-impl-notes.md) · [Task list](tasks/tasks-taskuda-v1.md)

## Planning your workday

- **Repeating tasks:** in the task editor, set Repeat to every day, every working day, weekly on chosen days, or monthly on a date. Each day you open gets its own copy, so repeats work with carryover, reminders, calendar sync and reports. Editing or deleting a repeat asks whether to change only that task or that one and all later ones; past days never change.
- **Overlap warnings:** notes and the editor flag timed tasks that clash, including imported meetings. Saving is never blocked.
- **Undo:** deleting a task shows Undo for 10 seconds.
- **Due dates:** "Add due date" in the task editor sets an optional date and time. With no time, the task is due at the end of that day.
- **At-risk markers:** a note shows one marker when its task slips: Overdue, Overran, Running late (still To Do 10 minutes after its start), Due today, or Stuck (carried over 3+ times). Above the blocks, "4 of 9 done" shows progress, and the At risk button lists the day's at-risk tasks. Markers never make a sound.
- **First run:** a short intro (skippable, and available again in Settings → About), then setup: your companies, your working days and close-out time, and Drive backup. Every step can be skipped.

### Workday settings (Settings → Workday)

| Setting | Default | What it does |
|---|---|---|
| Working days | Mon–Fri | Carryover goes to the next working day; the streak, the close-out reminder, eye breaks and "every working day" repeats skip other days. |
| Close-out reminder | 5:30 PM | A banner (and, if Taskuda is open, a toast and spoken line) until you close out or choose Not today. |
| Quiet hours | Off | No spoken alerts or eye-break prompts in this range; reminders still show on screen. |
| Eye breaks | Off | Every 20, 30, 45 or 60 minutes within set hours on working days, with Done and Snooze 5 min. |
| Daily time budget | Off | A gentle warning after 1–4 hours of time in Taskuda, then at most once per extra hour. Nothing is locked. |

Every alert runs only while Taskuda is open in the browser. Stats shows the carry-over rate per company, eye breaks taken, days within your time budget, deadlines met, and today's time in Taskuda. That time counts only while Taskuda is on screen on this device, so it isn't your total screen time.

## Stack

React 19 + TypeScript (strict) + Vite 8, Tailwind CSS v4 + shadcn/ui, @dnd-kit, Zustand (UI state), Dexie (IndexedDB), React Hook Form + Zod, date-fns, vite-plugin-pwa (Workbox). Tests: Vitest + Testing Library, Playwright + axe. Hosting: Vercel (static app + one serverless function for Jira).

## Getting started

Requires Node.js 24+.

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run dev            # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck and production build (`dist/`) |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | oxlint (incl. jsx-a11y) |
| `npm test` | Unit and component tests (Vitest) |
| `npm run e2e` | Browser tests (Playwright, desktop / tablet / phone sizes); run `npx playwright install chromium` once |
| `npm run format` | Prettier |

### Environment variables

| Name | Used by | Notes |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Browser (build time) | Google OAuth client ID. Public by design (it identifies the app, it isn't a secret). Without it, Drive backup and Calendar sync show "Google sign-in isn't set up". |
| `ALLOWED_ORIGIN` | `api/jira.ts` (server) | The only origin allowed to call the Jira proxy, e.g. `https://taskuda.example.com`. Without it the proxy refuses every request. |

Never put an AI key, Jira token or any other secret in `.env`: users add their own in the app, where they're encrypted.

## Google Cloud setup (Drive backup and Calendar)

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project and enable the **Google Drive API** and **Google Calendar API**.
2. **OAuth consent screen:** external, testing mode; add yourself (and up to 100 people) as test users.
3. **Scopes** (Taskuda asks for exactly these, each only when the feature is turned on):
   - `https://www.googleapis.com/auth/drive.appdata` — its own hidden backup folder only (non-sensitive)
   - `https://www.googleapis.com/auth/calendar.events.owned` — events on calendars you own
   - `https://www.googleapis.com/auth/calendar.calendarlist.readonly` — to pick a calendar
4. **Credentials → OAuth client ID → Web application.** Authorized JavaScript origins: `http://localhost:5173`, `http://localhost:4173` and your production origin. No redirect URIs are needed (token flow).
5. Put the client ID in `VITE_GOOGLE_CLIENT_ID`.

Going public later needs Google's (free) app verification for the Calendar scopes: privacy policy page, homepage, demo video, and the domain verified in Search Console (see PRD RK5).

People can also use **their own** client ID: Settings → Integrations → Advanced.

## Deploying to Vercel

1. Import the repository in Vercel (framework preset: Vite; `vercel.json` sets the build and headers).
2. Set `VITE_GOOGLE_CLIENT_ID` and `ALLOWED_ORIGIN` for Production.
3. Add your custom subdomain (e.g. `taskuda.example.com`) and point a CNAME at Vercel. If you ever delete the Vercel project, delete the DNS record too (PRD RK10).
4. Add the production origin to the Google OAuth client's authorized JavaScript origins.

`vercel.json` serves the app with a strict Content Security Policy (only Google, Gemini, OpenRouter and the app's own `/api` can be contacted), no-cache on `sw.js`, and long caching for hashed assets.

## Project structure

```
api/jira.ts              Vercel function entry (thin) for the Jira proxy
server/jiraProxy.ts      Proxy rules: allow-listed Jira endpoints, origin check, rate limit
src/
  app/                   App, providers, routes
  pages/                 Route pages — compose components only
  components/            UI by area (canvas, task, closeout, report, settings, backup, …) + ui/ (shadcn)
  hooks/                 Hooks that connect components to stores and services
  stores/                Zustand UI state
  services/              Data and integrations: db (Dexie), crypto (vault), google, backup, calendar, ai, jira, voice, reminders, workday, eyeBreaks, screenTime, tasks, pwa
  utils/                 Pure helpers (dates, time blocks, report formatting, metrics, …)
  schemas/               Zod schemas for forms and the backup file
  types/                 Shared types
e2e/                     Playwright tests (fake Google / Jira / speech where needed)
docs/                    PRD, design spec, implementation notes
```

## Privacy and security in short

- Tasks, repeating series, companies, closeouts and settings live in IndexedDB on the device; Drive holds an encrypted-keys backup in the app-data folder only Taskuda can see.
- The eye-break log and time in Taskuda never leave the device: they are not in backups or export files.
- AI keys and the Jira token are encrypted with AES-256-GCM. The data key is wrapped by a PBKDF2 (600k) passphrase key for backups and by a non-extractable device key, so the passphrase is needed once per device.
- AI requests contain only task titles, statuses, time blocks, companies, carryovers, the day rating and reflection — never notes or Jira details — and go straight to the chosen provider.
- Google access tokens stay in memory (no refresh tokens in a browser-only app).
- The Jira proxy forwards only to `*.atlassian.net` allow-listed endpoints, only for `ALLOWED_ORIGIN`, and logs nothing.
