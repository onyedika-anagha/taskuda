import { CanvasSkeleton } from '@/components/canvas/CanvasSkeleton'
import { CompanyTip, PastDayNotice, StorageErrorNotice } from '@/components/canvas/CanvasNotices'
import { BottomActionBar, DayActions } from '@/components/canvas/DayActions'
import { DayClosedBanner } from '@/components/canvas/DayClosedBanner'
import { CanvasBanners } from '@/components/canvas/CanvasBanners'
import { DayNavigator } from '@/components/canvas/DayNavigator'
import { ReminderCatchup } from '@/components/canvas/ReminderCatchup'
import { TaskCanvas } from '@/components/canvas/TaskCanvas'
import { LazyCloseoutDialog } from '@/components/closeout/LazyCloseoutDialog'
import { AddTaskFab } from '@/components/layout/AddTaskFab'
import { InstallPrompt } from '@/components/layout/InstallPrompt'
import { AppBar } from '@/components/layout/AppBar'
import { AppShell } from '@/components/layout/AppShell'
import { ShortcutsDialog } from '@/components/layout/ShortcutsDialog'
import { DeleteTaskDialog } from '@/components/task/DeleteTaskDialog'
import { TaskEditor } from '@/components/task/TaskEditor'
import { TimedTaskMoveDialog } from '@/components/task/TimedTaskMoveDialog'
import { useCanvasShortcuts } from '@/hooks/useCanvasShortcuts'
import { useCompanies } from '@/hooks/useCompanies'
import { useDayCloseout } from '@/hooks/useDayCloseout'
import { useDayNavigation } from '@/hooks/useDayNavigation'
import { useFirstRun } from '@/hooks/useFirstRun'
import { TABLET_UP, useMediaQuery } from '@/hooks/useMediaQuery'
import { useTaskRisks } from '@/hooks/useTaskRisks'
import { useTasksForDay } from '@/hooks/useTasksForDay'
import { useAppStatusStore } from '@/stores/appStatusStore'
import { useCanvasUiStore } from '@/stores/canvasUiStore'
import { useCloseoutStore } from '@/stores/closeoutStore'
import type { Task } from '@/types/task'
import { Navigate } from 'react-router'

const NO_TASKS: Task[] = []

/** S2 Today: composes the canvas and its overlays. */
export function TodayPage() {
  const nav = useDayNavigation()
  const isTabletUp = useMediaQuery(TABLET_UP)
  const tasks = useTasksForDay(nav.dayKey)
  const closeout = useDayCloseout(nav.dayKey)
  const { companies, byId: companiesById } = useCompanies()
  const storageStatus = useAppStatusStore((s) => s.storageStatus)
  const openCreate = useCanvasUiStore((s) => s.openCreate)
  const shortcutsOpen = useCanvasUiStore((s) => s.shortcutsOpen)
  const setShortcutsOpen = useCanvasUiStore((s) => s.setShortcutsOpen)
  const openCloseout = useCloseoutStore((s) => s.openCloseout)

  const storageBlocked = storageStatus === 'unavailable'
  const readOnly = nav.isPast || storageBlocked
  // Today and past days can be closed out (a forgotten day still gets its carryover); future days can't.
  const canCloseOut = !storageBlocked && (nav.isToday || nav.isPast)
  const onCloseOut = canCloseOut ? () => void openCloseout(nav.dayKey) : undefined
  const onAddTask = readOnly ? undefined : () => openCreate()
  useCanvasShortcuts(nav, readOnly)
  const firstRun = useFirstRun()
  const risks = useTaskRisks(tasks ?? NO_TASKS)

  if (firstRun === 'show-welcome') return <Navigate to="/welcome" replace />

  return (
    <AppShell
      appBar={
        <AppBar
          actions={
            isTabletUp ? (
              <DayActions dayKey={nav.dayKey} onAddTask={onAddTask} onCloseOut={onCloseOut} />
            ) : undefined
          }
        >
          <DayNavigator nav={nav} />
        </AppBar>
      }
    >
      <InstallPrompt />
      {nav.isToday ? <ReminderCatchup /> : null}
      {storageBlocked ? <StorageErrorNotice /> : <CanvasBanners />}
      {nav.isPast ? <PastDayNotice dayKey={nav.dayKey} /> : null}
      {closeout ? <DayClosedBanner dayKey={nav.dayKey} finishedAt={closeout.finishedAt} /> : null}
      {tasks?.length === 0 && companies?.length === 0 && !readOnly ? <CompanyTip /> : null}

      {tasks === undefined && !storageBlocked ? (
        <CanvasSkeleton />
      ) : (
        <TaskCanvas
          tasks={tasks ?? []}
          companiesById={companiesById}
          readOnly={readOnly}
          isToday={nav.isToday}
          risksById={risks.byId}
          today={risks.today}
          onAdd={openCreate}
        />
      )}

      {isTabletUp ? null : <BottomActionBar dayKey={nav.dayKey} onCloseOut={onCloseOut} />}
      {!isTabletUp && onAddTask ? <AddTaskFab onClick={onAddTask} /> : null}
      <TaskEditor dayKey={nav.dayKey} tasks={tasks ?? []} />
      <DeleteTaskDialog tasks={tasks ?? []} />
      <TimedTaskMoveDialog tasks={tasks ?? []} />
      <LazyCloseoutDialog tasks={tasks ?? []} companies={companies ?? []} companiesById={companiesById} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </AppShell>
  )
}
