import type { ReportData, ReportFormat, ReportGroup, ReportItem } from '@/types/report'
import { relativeDayName } from './dates'
import { formatDayLong } from './taskPresentation'

export const FORMAT_LABELS: Record<ReportFormat, string> = {
  slack: 'Slack',
  teams: 'Teams',
  jira: 'Jira',
  email: 'Email',
}

/** Section names from the design spec (Section 8, S6); "Carried to Monday" after a Friday. */
function sections(report: ReportData) {
  return [
    ['done', 'Done'],
    ['inProgress', 'In progress'],
    ['carried', `Carried to ${relativeDayName(report.dayKey, report.carriedToDayKey)}`],
  ] as const
}

interface Syntax {
  title: (text: string) => string
  heading: (text: string) => string
  section: (text: string) => string
  item: (text: string) => string
  /** Lines between blocks. */
  gap: string
}

const SYNTAX: Record<ReportFormat, Syntax> = {
  // Slack mrkdwn: *bold*, • bullets.
  slack: {
    title: (t) => `*${t}*`,
    heading: (t) => `*${t}*`,
    section: (t) => `_${t}_`,
    item: (t) => `• ${t}`,
    gap: '\n',
  },
  // Teams messages accept Markdown.
  teams: {
    title: (t) => `**${t}**`,
    heading: (t) => `**${t}**`,
    section: (t) => `*${t}*`,
    item: (t) => `- ${t}`,
    gap: '\n',
  },
  // Jira wiki markup.
  jira: {
    title: (t) => `h3. ${t}`,
    heading: (t) => `h4. ${t}`,
    section: (t) => `*${t}*`,
    item: (t) => `* ${t}`,
    gap: '\n',
  },
  // Plain text that reads well in any email client.
  email: {
    title: (t) => t,
    heading: (t) => t.toUpperCase(),
    section: (t) => `${t}:`,
    item: (t) => `- ${t}`,
    gap: '\n',
  },
}

function itemText(item: ReportItem): string {
  return item.jiraKey ? `${item.jiraKey} ${item.title}` : item.title
}

function groupLines(group: ReportGroup, syntax: Syntax, labels: ReturnType<typeof sections>): string[] {
  const blocks: string[] = []
  if (group.heading) blocks.push(syntax.heading(group.heading))
  for (const [key, label] of labels) {
    const items = group[key]
    if (!items.length) continue
    blocks.push([syntax.section(label), ...items.map((i) => syntax.item(itemText(i)))].join('\n'))
  }
  return blocks
}

/**
 * "8 done · 3 in progress · 2 carried to tomorrow, across 3 companies" (PRD AC24.1, design S6).
 * Zero counts are left out; `null` when there's nothing to sum up.
 */
export function summaryLine(report: ReportData): string | null {
  const summary = report.summary
  if (!summary) return null
  const counts = [
    summary.done ? `${summary.done} done` : null,
    summary.inProgress ? `${summary.inProgress} in progress` : null,
    summary.carried
      ? `${summary.carried} carried to ${relativeDayName(report.dayKey, report.carriedToDayKey)}`
      : null,
  ].filter((part): part is string => part !== null)
  if (!counts.length) return null
  const across = summary.companies
    ? `, across ${summary.companies} ${summary.companies === 1 ? 'company' : 'companies'}`
    : ''
  return counts.join(' · ') + across
}

export function reportTitle(report: ReportData): string {
  const day = formatDayLong(report.dayKey)
  return report.scopeName ? `End-of-day report · ${report.scopeName} · ${day}` : `End-of-day report · ${day}`
}

/** The exact text that gets copied (PRD AC14.2). */
export function formatReport(report: ReportData, format: ReportFormat): string {
  const syntax = SYNTAX[format]
  const labels = sections(report)
  const summary = report.summary ? summaryLine(report) : null
  const blocks = [
    syntax.title(reportTitle(report)),
    ...(summary ? [summary] : []),
    ...report.groups.flatMap((g) => groupLines(g, syntax, labels)),
  ]
  return blocks.join(`\n${syntax.gap}`)
}
