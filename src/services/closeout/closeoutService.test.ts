import { beforeEach, describe, expect, it } from 'vitest'
import { getCloseout, recordReportCopied } from '@/services/db/closeoutRepository'
import { ValidationError } from '@/services/db/errors'
import { createTask, getTask, listTasksForDay, setTaskStatus } from '@/services/db/taskRepository'
import { resetDatabase } from '@/test/resetDatabase'
import { discardDraft, finishCloseout, loadDraft, newDraft, saveDraft } from './closeoutService'

const DAY = '2026-10-19'
const NEXT = '2026-10-20'

describe('closeoutService', () => {
  beforeEach(resetDatabase)

  it('DAC13 saves and reloads a draft', async () => {
    const draft = { ...newDraft(DAY, 1000), step: 'reflect' as const, rating: 3 }
    await saveDraft(draft)
    expect(await loadDraft(DAY)).toEqual(draft)
    await discardDraft(DAY)
    expect(await loadDraft(DAY)).toBeNull()
  })

  it('AC10.1 refuses to finish while a task has no decision', async () => {
    await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
    await expect(finishCloseout({ ...newDraft(DAY), rating: 4 })).rejects.toThrow(
      new ValidationError('1 task still needs a decision'),
    )
  })

  it('AC10.2 requires a rating', async () => {
    await expect(finishCloseout(newDraft(DAY))).rejects.toThrow(
      new ValidationError('Pick a rating to continue.'),
    )
  })

  it('AC10.3 / AC11.1 carries over, deletes and records the closeout together', async () => {
    const carry = await createTask({ title: 'Carry me', dayKey: DAY, block: 'afternoon' })
    const remove = await createTask({ title: 'Drop me', dayKey: DAY, block: 'morning' })
    const done = await createTask({ title: 'Done', dayKey: DAY, block: 'morning' })
    await setTaskStatus(done.id, 'done')
    await setTaskStatus(carry.id, 'in_progress')
    const draft = {
      ...newDraft(DAY, 1000),
      outcomes: { [carry.id]: 'carry_over' as const, [remove.id]: 'delete' as const },
      rating: 5,
      reflection: '  Good day  ',
      reportCopiedAt: 4000,
    }
    await saveDraft(draft)

    const result = await finishCloseout(draft, 9000)

    expect(result).toMatchObject({ carried: 1, deleted: 1 })
    expect(await getTask(remove.id)).toBeUndefined()
    const next = await listTasksForDay(NEXT)
    expect(next).toMatchObject([
      { title: 'Carry me', block: 'afternoon', status: 'in_progress', carriedOverCount: 1 },
    ])
    expect(await getCloseout(DAY)).toMatchObject({
      startedAt: 1000,
      finishedAt: 9000,
      reportCopiedAt: 4000,
      rating: 5,
      reflection: 'Good day',
    })
    expect(await loadDraft(DAY)).toBeNull()
  })

  it('ignores outcomes for tasks that were finished meanwhile', async () => {
    const task = await createTask({ title: 'A', dayKey: DAY, block: 'morning' })
    await setTaskStatus(task.id, 'done')
    const result = await finishCloseout({ ...newDraft(DAY), rating: 3, outcomes: { [task.id]: 'delete' } })
    expect(result.deleted).toBe(0)
    expect(await getTask(task.id)).toBeDefined()
  })

  it('closing out again keeps the first closeout’s timing for M3', async () => {
    await finishCloseout({ ...newDraft(DAY, 1000), rating: 3, reportCopiedAt: 2000 }, 3000)
    await finishCloseout({ ...newDraft(DAY, 50_000), rating: 4, reportCopiedAt: 60_000 }, 70_000)
    expect(await getCloseout(DAY)).toMatchObject({
      startedAt: 1000,
      reportCopiedAt: 2000,
      finishedAt: 70_000,
      rating: 4,
    })
  })

  it('copying from the Report page fills in M3 only once', async () => {
    await finishCloseout({ ...newDraft(DAY, 1000), rating: 3 }, 3000)
    await recordReportCopied(DAY, 5000)
    await recordReportCopied(DAY, 9000)
    expect((await getCloseout(DAY))?.reportCopiedAt).toBe(5000)
  })
})
