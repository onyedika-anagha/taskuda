import type { AiPrompt } from '@/types/ai'
import type { TaskOutcome } from '@/types/closeout'
import type { Company } from '@/types/company'
import type { Task } from '@/types/task'
import { BLOCK_LABELS, formatDayLong } from '@/utils/taskPresentation'
import { RATING_LABELS } from '@/utils/closeoutRules'
import { STATUS_LABELS } from '@/utils/taskStatus'

export interface RecommendationInput {
  dayKey: string
  tasks: Task[]
  companiesById: Map<string, Company>
  outcomes: Record<string, TaskOutcome>
  rating: number | null
  reflection: string
}

const SYSTEM = [
  'You are a concise productivity coach for one person who works for several employers or clients.',
  'From their day, name what slowed them down and what to change tomorrow.',
  'Give 2 to 4 recommendations. Each needs a short title (max 8 words) and one practical sentence (max 30 words).',
  'Only use the facts given. Do not invent tasks, people or numbers.',
  'Answer with JSON only, in this shape: {"recommendations":[{"title":"...","detail":"..."}]}',
].join('\n')

/**
 * Builds the request from exactly the data the disclosure lists (PRD AC13.3):
 * task titles, statuses, companies, time blocks, carryovers, the rating and the reflection.
 * Task notes, Jira details and anything else stay on the device.
 */
export function buildRecommendationPrompt(input: RecommendationInput): AiPrompt {
  const lines = input.tasks.map((task) => {
    const company = task.companyId ? input.companiesById.get(task.companyId)?.name : undefined
    const parts = [`- ${task.title}`, STATUS_LABELS[task.status], BLOCK_LABELS[task.block]]
    if (company) parts.push(`for ${company}`)
    if (task.carriedOverCount > 0) parts.push(`carried over from earlier days ${task.carriedOverCount}×`)
    const outcome = input.outcomes[task.id]
    if (outcome === 'carry_over') parts.push('moving to the next working day')
    if (outcome === 'delete') parts.push('dropped today')
    return parts.join(' | ')
  })

  const user = [
    `Day: ${formatDayLong(input.dayKey)}`,
    input.rating ? `Day rating: ${input.rating}/5 (${RATING_LABELS[input.rating]})` : 'Day rating: not given',
    `Reflection: ${input.reflection.trim() || 'none'}`,
    'Tasks (title | status | time of day | company | notes):',
    ...(lines.length ? lines : ['- no tasks']),
  ].join('\n')

  return { system: SYSTEM, user }
}
