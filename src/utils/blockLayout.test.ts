import { describe, expect, it } from 'vitest'
import { makeTask } from '@/test/factories'
import { layoutFromTasks, moveInLayout, positionOf } from './blockLayout'

describe('blockLayout', () => {
  const layout = layoutFromTasks([
    makeTask({ id: 'a', block: 'morning' }),
    makeTask({ id: 'b', block: 'morning' }),
    makeTask({ id: 'c', block: 'evening' }),
  ])

  it('groups task ids by block in order', () => {
    expect(layout).toEqual({ morning: ['a', 'b'], afternoon: [], evening: ['c'] })
  })

  it('moves within and across blocks without mutating the input', () => {
    expect(moveInLayout(layout, 'b', 'morning', 0).morning).toEqual(['b', 'a'])
    expect(moveInLayout(layout, 'a', 'evening', 1)).toEqual({
      morning: ['b'],
      afternoon: [],
      evening: ['c', 'a'],
    })
    expect(moveInLayout(layout, 'a', 'afternoon', 99).afternoon).toEqual(['a'])
    expect(layout.morning).toEqual(['a', 'b'])
  })

  it('finds a task’s position', () => {
    expect(positionOf(layout, 'c')).toEqual({ block: 'evening', index: 0 })
    expect(positionOf(layout, 'missing')).toBeUndefined()
  })
})
