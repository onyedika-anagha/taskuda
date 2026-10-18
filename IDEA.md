Taskuda — visual task manager + auto EOD reporting PWA
View project
promoted
Captured via Claude · Aug 25, 2026
Summary
Free, non-commercial PWA for people juggling multiple jobs/clients (target persona: "Parallel Professional". Sticky-note canvas UI grouped into Morning/Afternoon/Evening blocks, color-coded by company/employer, 3-state task toggle (To Do → In Progress → Done). Storage: user's own Google Drive (no central backend DB) — BYO AI key (Gemini/OpenRouter) stored encrypted in a file on the user's Drive. Google Calendar two-way sync (Taskuda tasks become calendar events and vice versa). Voice/audio notification engine via client-side Web Speech API (Chromium) for pre-task reminders, start alerts, and completion cheers. EOD closeout flow: guided reflection, completion-rating, AI recommendations on bottlenecks (required for v1), zero-wipe carryover of unfinished tasks to next day. Report builder with one-click copy formatted for Slack/Teams/Jira/email.

V1 scope (all required for launch, decided against deferring further — user wants to build once and not revisit for months): sticky-note canvas, color tagging, 3-state toggle, manual task creation, Google Drive storage, Google Calendar two-way sync, voice engine, EOD closeout + carryover, report builder, BYO AI key + AI EOD recommendations, Jira integration only (Asana/Trello explicitly deferred to v2 as unused surface area right now).

V2 (deferred): Asana + Trello sync, 7-day weekly review dashboard, deeper AI pattern-detection across weeks, multi-device Drive sync conflict resolution, PDF export.

Success metrics still being locked (baseline numbers pending from user): (1) EOD reporting time reduction — baseline TBD, (2) task retention — target 0% of tasks silently dropped over a 4-week window via carryover, (3) personal adoption — daily use for 4 straight weeks without falling back to current workflow (current fallback tool TBD).

Open risks flagged: Web Speech API voice/background reliability varies across browsers and mobile PWA lock-screen states; BYO AI key security tradeoff of client-side key handling even with Drive encryption; no dedicated build time carved out (personal project alongside Cusorcart/LocTech/job search), all-features-at-launch scope is a real schedule risk.

Status: PM-stage PRD in progress via project-manager-sdlc persona. Not yet gate-passed — still need success metric baseline numbers before Definition of Ready checklist can be completed.
