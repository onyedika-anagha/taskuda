import { describe, expect, it } from 'vitest'
import { makeTask } from '@/test/factories'
import { formatTimeRange, overlapMarkerLabel, overlapWarningText } from './overlapLabels'

describe('formatTimeRange', () => {
  it('shares AM/PM when both ends are on the same side of noon', () => {
    expect(formatTimeRange('14:00', 30)).toBe('2:00–2:30 PM')
  })

  it('names both when the range crosses noon or midnight', () => {
    expect(formatTimeRange('11:45', 30)).toBe('11:45 AM–12:15 PM')
    expect(formatTimeRange('23:45', 30)).toBe('11:45 PM–12:15 AM')
  })
})

describe('overlap labels (design spec Section 8)', () => {
  const call = makeTask({ title: 'Client call', startTime: '14:00', durationMinutes: null })
  const standup = makeTask({ title: 'Standup', startTime: '14:15', durationMinutes: 15 })

  it('marker names one task, or counts several', () => {
    expect(overlapMarkerLabel([call])).toBe('Overlaps with Client call')
    expect(overlapMarkerLabel([call, standup])).toBe('Overlaps with 2 tasks')
  })

  it('editor warning shows the other task and its time', () => {
    expect(overlapWarningText([call])).toBe('Overlaps with Client call (2:00–2:30 PM). You can still save.')
    expect(overlapWarningText([call, standup])).toBe(
      'Overlaps with 2 tasks: Client call (2:00–2:30 PM), Standup (2:15–2:30 PM). You can still save.',
    )
  })
})
