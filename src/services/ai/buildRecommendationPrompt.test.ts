import { describe, expect, it } from 'vitest'
import { makeCompany, makeTask } from '@/test/factories'
import { buildRecommendationPrompt } from './buildRecommendationPrompt'

describe('buildRecommendationPrompt (AC13.3 data minimization)', () => {
  const tasks = [
    makeTask({
      id: '1',
      title: 'Client call',
      companyId: 'acme',
      status: 'done',
      notes: 'PRIVATE NOTE with phone 0803',
      jiraIssue: { key: 'ACM-1', title: 'Secret Jira title', status: 'Done' },
    }),
    makeTask({ id: '2', title: 'Write spec', status: 'todo', carriedOverCount: 2, block: 'morning' }),
  ]

  const prompt = buildRecommendationPrompt({
    dayKey: '2026-10-19',
    tasks,
    companiesById: new Map([['acme', makeCompany()]]),
    outcomes: { '2': 'carry_over' },
    rating: 2,
    reflection: 'Too many meetings',
  })

  it('includes titles, statuses, companies, carryovers, rating and reflection', () => {
    expect(prompt.user).toContain('- Client call | Done | Afternoon | for Acme')
    expect(prompt.user).toContain(
      '- Write spec | To Do | Morning | carried over from earlier days 2× | moving to tomorrow',
    )
    expect(prompt.user).toContain('Day rating: 2/5 (Meh)')
    expect(prompt.user).toContain('Reflection: Too many meetings')
  })

  it('leaves out notes and Jira details', () => {
    const all = prompt.system + prompt.user
    expect(all).not.toContain('PRIVATE NOTE')
    expect(all).not.toContain('ACM-1')
    expect(all).not.toContain('Secret Jira title')
  })

  it('asks for JSON in a fixed shape', () => {
    expect(prompt.system).toContain('{"recommendations":[{"title":"...","detail":"..."}]}')
  })
})
