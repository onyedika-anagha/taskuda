import { CanvasSkeleton } from '@/components/canvas/CanvasSkeleton'
import { CompanyTip, PastDayNotice, StorageErrorNotice } from '@/components/canvas/CanvasNotices'
import { DayNavigator } from '@/components/canvas/DayNavigator'
import { TaskCanvas } from '@/components/canvas/TaskCanvas'
import { AddTaskFab } from '@/components/layout/AddTaskFab'
import { AppBar } from '@/components/layout/AppBar'
import { AppShell } from '@/components/layout/AppShell'
import { ShortcutsDialog } from '@/components/layout/ShortcutsDialog'
import { DeleteTaskDialog } from '@/components/task/DeleteTaskDialog'
import { TaskEditor } from '@/components/task/TaskEditor'
import { TimedTaskMoveDialog } from '@/components/task/TimedTaskMoveDialog'
import { useCanvasShortcuts } from '@/hooks/useCanvasShortcuts'
import { useCompanies } from '@/hooks/useCompanies'
import { useDayNavigation } from '@/hooks/useDayNavigation'
import { useTasksForDay } from '@/hooks/useTasksForDay'
import { useAppStatusStore } from '@/stores/appStatusStore'
import { useCanvasUiStore } from '@/stores/canvasUiStore'

/** S2 Today: composes the canvas and its overlays. */
export function TodayPage() {
  const nav = useDayNavigation()
  const tasks = useTasksForDay(nav.dayKey)
  const { companies, byId: companiesById } = useCompanies()
  const storageStatus = useAppStatusStore((s) => s.storageStatus)
  const openCreate = useCanvasUiStore((s) => s.openCreate)
  const shortcutsOpen = useCanvasUiStore((s) => s.shortcutsOpen)
  const setShortcutsOpen = useCanvasUiStore((s) => s.setShortcutsOpen)

  const storageBlocked = storageStatus === 'unavailable'
  const readOnly = nav.isPast || storageBlocked
  useCanvasShortcuts(nav, readOnly)

  return (
    <AppShell
      appBar={
        <AppBar onAddTask={readOnly ? undefined : () => openCreate()}>
          <DayNavigator nav={nav} />
        </AppBar>
      }
    >
      {storageBlocked ? <StorageErrorNotice /> : null}
      {nav.isPast ? <PastDayNotice dayKey={nav.dayKey} /> : null}
      {tasks?.length === 0 && companies?.length === 0 && !readOnly ? <CompanyTip /> : null}

      {tasks === undefined && !storageBlocked ? (
        <CanvasSkeleton />
      ) : (
        <TaskCanvas
          tasks={tasks ?? []}
          companiesById={companiesById}
          readOnly={readOnly}
          onAdd={openCreate}
        />
      )}

      {readOnly ? null : <AddTaskFab onClick={() => openCreate()} />}
      <TaskEditor dayKey={nav.dayKey} tasks={tasks ?? []} />
      <DeleteTaskDialog tasks={tasks ?? []} />
      <TimedTaskMoveDialog tasks={tasks ?? []} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </AppShell>
  )
}
