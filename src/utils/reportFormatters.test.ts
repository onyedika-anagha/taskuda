import { describe, expect, it } from 'vitest'
import { makeCompany, makeTask } from '@/test/factories'
import { buildReport, isReportEmpty } from './reportBuilder'
import { formatReport } from './reportFormatters'

const DAY = '2026-10-19'
const acme = makeCompany({ id: 'acme', name: 'Acme' })
const north = makeCompany({ id: 'north', name: 'Northwind' })

const tasks = [
  makeTask({ id: '1', title: 'Ship login', companyId: 'acme', status: 'done' }),
  makeTask({
    id: '2',
    title: 'Fix bug',
    companyId: 'acme',
    status: 'in_progress',
    jiraIssue: { key: 'ACM-12', title: 'Bug', status: 'In Progress' },
  }),
  makeTask({ id: '3', title: 'Write spec', companyId: 'north', status: 'todo' }),
  makeTask({ id: '4', title: 'Inbox zero', companyId: null, status: 'done' }),
  makeTask({ id: '5', title: 'Old idea', companyId: 'north', status: 'todo' }),
]

const report = (scope = 'all', pendingOutcomes = {}) =>
  buildReport({ dayKey: DAY, tasks, companies: [north, acme], scope, pendingOutcomes })

describe('buildReport (AC14.1, AC14.4)', () => {
  it('groups by company for “All companies”, with no-company tasks under Other', () => {
    const data = report('all', { '3': 'carry_over', '5': 'delete' })
    expect(data.groups.map((g) => g.heading)).toEqual(['Acme', 'Northwind', 'Other'])
    expect(data.groups[0]).toMatchObject({
      done: [{ title: 'Ship login' }],
      inProgress: [{ title: 'Fix bug', jiraKey: 'ACM-12' }],
      carried: [],
    })
    // Deleted at closeout: left out. Carry-over choice shows before Finish.
    expect(data.groups[1]).toMatchObject({ done: [], inProgress: [], carried: [{ title: 'Write spec' }] })
  })

  it('reports one company without group headings', () => {
    const data = report('north', { '3': 'carry_over' })
    expect(data.scopeName).toBe('Northwind')
    expect(data.groups).toHaveLength(1)
    expect(data.groups[0].heading).toBeNull()
  })

  it('counts tasks already carried over as carried', () => {
    const data = buildReport({
      dayKey: DAY,
      tasks: [makeTask({ title: 'Carried', status: 'in_progress', carriedToTaskId: 'x' })],
      companies: [],
      scope: 'all',
    })
    expect(data.groups[0].carried).toEqual([{ title: 'Carried', jiraKey: null }])
    expect(data.groups[0].inProgress).toEqual([])
  })

  it('is empty when nothing is done, in progress or carried', () => {
    expect(
      isReportEmpty(buildReport({ dayKey: DAY, tasks: [makeTask()], companies: [], scope: 'all' })),
    ).toBe(true)
  })
})

describe('formatReport (AC14.2)', () => {
  const data = report('acme')

  it('Slack', () => {
    expect(formatReport(data, 'slack')).toBe(
      [
        '*End-of-day report · Acme · Monday, Oct 19*',
        '',
        '_Done_',
        '• Ship login',
        '',
        '_In progress_',
        '• ACM-12 Fix bug',
      ].join('\n'),
    )
  })

  it('Teams', () => {
    expect(formatReport(data, 'teams')).toBe(
      [
        '**End-of-day report · Acme · Monday, Oct 19**',
        '',
        '*Done*',
        '- Ship login',
        '',
        '*In progress*',
        '- ACM-12 Fix bug',
      ].join('\n'),
    )
  })

  it('Jira wiki markup', () => {
    expect(formatReport(data, 'jira')).toBe(
      [
        'h3. End-of-day report · Acme · Monday, Oct 19',
        '',
        '*Done*',
        '* Ship login',
        '',
        '*In progress*',
        '* ACM-12 Fix bug',
      ].join('\n'),
    )
  })

  it('Email plain text with company headings', () => {
    expect(formatReport(report('all', { '3': 'carry_over', '5': 'delete' }), 'email')).toBe(
      [
        'End-of-day report · Monday, Oct 19',
        '',
        'ACME',
        '',
        'Done:',
        '- Ship login',
        '',
        'In progress:',
        '- ACM-12 Fix bug',
        '',
        'NORTHWIND',
        '',
        'Carried to tomorrow:',
        '- Write spec',
        '',
        'OTHER',
        '',
        'Done:',
        '- Inbox zero',
      ].join('\n'),
    )
  })
})
