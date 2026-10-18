import type { ReportData, ReportFormat, ReportGroup, ReportItem } from '@/types/report'
import { formatDayLong } from './taskPresentation'

export const FORMAT_LABELS: Record<ReportFormat, string> = {
  slack: 'Slack',
  teams: 'Teams',
  jira: 'Jira',
  email: 'Email',
}

/** Section names from the design spec (Section 8, S6). */
const SECTIONS = [
  ['done', 'Done'],
  ['inProgress', 'In progress'],
  ['carried', 'Carried to tomorrow'],
] as const

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

function groupLines(group: ReportGroup, syntax: Syntax): string[] {
  const blocks: string[] = []
  if (group.heading) blocks.push(syntax.heading(group.heading))
  for (const [key, label] of SECTIONS) {
    const items = group[key]
    if (!items.length) continue
    blocks.push([syntax.section(label), ...items.map((i) => syntax.item(itemText(i)))].join('\n'))
  }
  return blocks
}

export function reportTitle(report: ReportData): string {
  const day = formatDayLong(report.dayKey)
  return report.scopeName ? `End-of-day report · ${report.scopeName} · ${day}` : `End-of-day report · ${day}`
}

/** The exact text that gets copied (PRD AC14.2). */
export function formatReport(report: ReportData, format: ReportFormat): string {
  const syntax = SYNTAX[format]
  const blocks = [syntax.title(reportTitle(report)), ...report.groups.flatMap((g) => groupLines(g, syntax))]
  return blocks.join(`\n${syntax.gap}`)
}
