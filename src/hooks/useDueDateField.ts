import { useState } from 'react'
import { flushSync } from 'react-dom'
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { useNow } from '@/hooks/useNow'
import type { TaskFormValues } from '@/schemas/taskForm'
import { isValidDayKey } from '@/utils/dates'
import { isDuePassed } from '@/utils/dueDates'

export const DUE_DATE_INPUT_ID = 'task-due-date'
export const ADD_DUE_DATE_ID = 'task-add-due-date'

function focusById(id: string): void {
  document.getElementById(id)?.focus()
}

/**
 * S3 Due date (PRD FR30, design F18): collapsed until used, hidden while the task repeats (the
 * saved task then gets no due date, AC30.5), with the "has passed" hint (AC30.3). Focus moves as
 * in design Section 7.
 */
export function useDueDateField(control: Control<TaskFormValues>, setValue: UseFormSetValue<TaskFormValues>) {
  const [repeat, dueDate, dueTime] = useWatch({ control, name: ['repeat', 'dueDate', 'dueTime'] })
  const [expanded, setExpanded] = useState(false)
  const now = useNow(60_000)
  const repeating = repeat !== 'none'

  return {
    repeating,
    opened: !repeating && (expanded || dueDate !== ''),
    /** A due date was entered and then Repeat was turned on: it won't be saved. */
    droppedForRepeat: repeating && dueDate !== '',
    passed: isValidDayKey(dueDate) && isDuePassed({ dueDate, dueTime: dueTime || null }, now),
    open() {
      flushSync(() => setExpanded(true))
      focusById(DUE_DATE_INPUT_ID)
    },
    remove() {
      flushSync(() => {
        setValue('dueDate', '', { shouldDirty: true })
        setValue('dueTime', '', { shouldDirty: true })
        setExpanded(false)
      })
      focusById(ADD_DUE_DATE_ID)
    },
  }
}
