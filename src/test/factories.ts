import type { Company } from '@/types/company'
import type { Task } from '@/types/task'

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Client call',
    notes: '',
    companyId: null,
    dayKey: '2026-10-19',
    block: 'afternoon',
    order: 1000,
    startTime: null,
    durationMinutes: null,
    status: 'todo',
    carriedOverCount: 0,
    carriedFromTaskId: null,
    carriedToTaskId: null,
    source: 'manual',
    jiraIssue: null,
    seriesId: null,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

export function makeCompany(overrides: Partial<Company> = {}): Company {
  return { id: 'acme', name: 'Acme', colorId: 'teal', createdAt: 1, updatedAt: 1, ...overrides }
}
