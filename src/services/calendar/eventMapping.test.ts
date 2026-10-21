import { describe, expect, it } from 'vitest'
import { makeTask } from '@/test/factories'
import { eventToTaskFields, localTimeZone, taskToEvent } from './eventMapping'

describe('eventMapping', () => {
  it('turns a timed task into a local-time event marked with the task id', () => {
    const event = taskToEvent(
      {
        ...makeTask({ id: 't1', title: 'Client call', dayKey: '2026-10-19', durationMinutes: 45 }),
        startTime: '14:00',
      },
      'Acme',
    )
    expect(event).toEqual({
      summary: 'Client call',
      description: 'Acme · from Taskuda',
      start: { dateTime: '2026-10-19T14:00:00', timeZone: localTimeZone() },
      end: { dateTime: '2026-10-19T14:45:00', timeZone: localTimeZone() },
      extendedProperties: { private: { taskudaTaskId: 't1' } },
    })
  })

  it('PRD Out of Scope 24: never sends the due date to Calendar', () => {
    const base = { ...makeTask({ dayKey: '2026-10-19' }), startTime: '14:00' }
    const withDue = { ...base, dueDate: '2026-10-24', dueTime: '17:00' }
    expect(taskToEvent(withDue)).toEqual(taskToEvent(base))
  })

  it('gives events without a duration 30 minutes, crossing midnight correctly', () => {
    const event = taskToEvent({ ...makeTask({ dayKey: '2026-10-19' }), startTime: '23:45' })
    expect(event.end?.dateTime).toBe('2026-10-20T00:15:00')
  })

  it('reads a timed event as task fields in local time', () => {
    const start = new Date(2026, 9, 21, 9, 30)
    const end = new Date(2026, 9, 21, 10, 15)
    expect(
      eventToTaskFields({
        id: 'e',
        status: 'confirmed',
        updated: '',
        summary: '  Standup  ',
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      }),
    ).toEqual({ title: 'Standup', dayKey: '2026-10-21', startTime: '09:30', durationMinutes: 45 })
  })

  it('skips all-day events and caps long titles', () => {
    expect(
      eventToTaskFields({ id: 'e', status: 'confirmed', updated: '', start: { date: '2026-10-21' } }),
    ).toBeNull()
    const fields = eventToTaskFields({
      id: 'e',
      status: 'confirmed',
      updated: '',
      summary: 'x'.repeat(500),
      start: { dateTime: new Date(2026, 9, 21, 9).toISOString() },
    })
    expect(fields?.title).toHaveLength(200)
    expect(fields?.durationMinutes).toBeNull()
  })
})
