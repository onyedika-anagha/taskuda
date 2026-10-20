import { describe, expect, it } from 'vitest'
import { makeTask } from '@/test/factories'
import { overlapMap, overlapsFor } from './overlaps'

const ids = (tasks: { id: string }[]) => tasks.map((t) => t.id)

describe('overlapsFor (PRD AC25.1)', () => {
  it('finds tasks whose time ranges cross', () => {
    const call = makeTask({ id: 'call', startTime: '14:00', durationMinutes: 60 })
    const standup = makeTask({ id: 'standup', startTime: '14:30', durationMinutes: 15 })
    const later = makeTask({ id: 'later', startTime: '16:00', durationMinutes: 30 })
    expect(ids(overlapsFor(call, [call, standup, later]))).toEqual(['standup'])
  })

  it('tasks that only touch at the ends do not overlap', () => {
    const a = makeTask({ id: 'a', startTime: '14:00', durationMinutes: 30 })
    const b = makeTask({ id: 'b', startTime: '14:30', durationMinutes: 30 })
    expect(overlapsFor(a, [a, b])).toEqual([])
    expect(overlapsFor(b, [a, b])).toEqual([])
  })

  it('a task with no duration counts as 30 minutes', () => {
    const a = makeTask({ id: 'a', startTime: '14:00', durationMinutes: null })
    const at29 = makeTask({ id: 'b', startTime: '14:29', durationMinutes: 10 })
    const at30 = makeTask({ id: 'c', startTime: '14:30', durationMinutes: 10 })
    expect(ids(overlapsFor(a, [a, at29, at30]))).toEqual(['b'])
  })

  it('ignores done tasks and tasks without a start time', () => {
    const a = makeTask({ id: 'a', startTime: '14:00', durationMinutes: 60 })
    const done = makeTask({ id: 'done', startTime: '14:15', status: 'done' })
    const untimed = makeTask({ id: 'untimed', startTime: null, durationMinutes: 60 })
    expect(overlapsFor(a, [a, done, untimed])).toEqual([])
    expect(overlapsFor(done, [a, done])).toEqual([])
  })

  it('AC25.4 includes tasks imported from the calendar', () => {
    const a = makeTask({ id: 'a', startTime: '09:00', durationMinutes: 30 })
    const meeting = makeTask({ id: 'm', startTime: '09:15', durationMinutes: 30, source: 'calendar' })
    expect(ids(overlapsFor(a, [a, meeting]))).toEqual(['m'])
  })

  it('checks an unsaved draft against the day, without matching itself', () => {
    const existing = makeTask({ id: 'a', startTime: '10:00', durationMinutes: 30 })
    const draft = { id: '', startTime: '10:10', durationMinutes: null, status: 'todo' as const }
    expect(ids(overlapsFor(draft, [existing]))).toEqual(['a'])
  })
})

describe('overlapMap', () => {
  it('maps every overlapping task to the tasks it overlaps', () => {
    const a = makeTask({ id: 'a', startTime: '14:00', durationMinutes: 60 })
    const b = makeTask({ id: 'b', startTime: '14:10', durationMinutes: 10 })
    const c = makeTask({ id: 'c', startTime: '14:40', durationMinutes: 30 })
    const d = makeTask({ id: 'd', startTime: '18:00' })
    const map = overlapMap([a, b, c, d])
    expect(ids(map.get('a') ?? [])).toEqual(['b', 'c'])
    expect(ids(map.get('b') ?? [])).toEqual(['a'])
    expect(ids(map.get('c') ?? [])).toEqual(['a'])
    expect(map.has('d')).toBe(false)
  })
})
