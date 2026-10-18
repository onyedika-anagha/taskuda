import { describe, expect, it } from 'vitest'
import { STATUS_LABELS, nextStatus } from './taskStatus'

describe('taskStatus', () => {
  it('AC4.1 cycles To Do → In Progress → Done → To Do', () => {
    expect(nextStatus('todo')).toBe('in_progress')
    expect(nextStatus('in_progress')).toBe('done')
    expect(nextStatus('done')).toBe('todo')
  })

  it('uses human labels, never internal values', () => {
    expect(STATUS_LABELS).toEqual({ todo: 'To Do', in_progress: 'In Progress', done: 'Done' })
  })
})
