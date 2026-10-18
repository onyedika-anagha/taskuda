import { describe, expect, it } from 'vitest'
import { makeTask } from '@/test/factories'
import { carryOverAll, relevantOutcomes, undecidedCount, unfinishedTasks } from './closeoutRules'

const tasks = [
  makeTask({ id: 'todo', status: 'todo' }),
  makeTask({ id: 'doing', status: 'in_progress' }),
  makeTask({ id: 'done', status: 'done' }),
  makeTask({ id: 'carried', status: 'todo', carriedToTaskId: 'copy' }),
]

describe('closeoutRules', () => {
  it('unfinished = not Done and not already carried', () => {
    expect(unfinishedTasks(tasks).map((t) => t.id)).toEqual(['todo', 'doing'])
  })

  it('counts tasks still waiting for a decision (AC10.1)', () => {
    expect(undecidedCount(tasks, {})).toBe(2)
    expect(undecidedCount(tasks, { todo: 'delete' })).toBe(1)
  })

  it('“Carry over all” fills only undecided tasks and keeps explicit deletes', () => {
    expect(carryOverAll(tasks, { todo: 'delete' })).toEqual({ todo: 'delete', doing: 'carry_over' })
  })

  it('drops outcomes for tasks that were finished meanwhile', () => {
    expect(relevantOutcomes(tasks, { todo: 'carry_over', done: 'delete', gone: 'delete' })).toEqual({
      todo: 'carry_over',
    })
  })
})
