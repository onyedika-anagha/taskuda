import { useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCloseoutStore } from '@/stores/closeoutStore'
import type { Company } from '@/types/company'
import type { Task } from '@/types/task'
import { formatDayLong } from '@/utils/taskPresentation'
import { AlreadyClosedView } from './AlreadyClosedView'
import { CloseoutSteps } from './CloseoutSteps'

interface CloseoutDialogProps {
  tasks: Task[]
  companies: Company[]
  companiesById: Map<string, Company>
}

/** S5 Closeout: full screen on phones, a large dialog from 640px up. */
export function CloseoutDialog({ tasks, companies, companiesById }: CloseoutDialogProps) {
  const view = useCloseoutStore((s) => s.view)
  const close = useCloseoutStore((s) => s.close)
  const startAgain = useCloseoutStore((s) => s.startAgain)
  const [confirmLeave, setConfirmLeave] = useState(false)

  const dayKey =
    view.mode === 'open' ? view.draft.dayKey : view.mode === 'already-closed' ? view.dayKey : null
  const title = dayKey ? `Close out ${formatDayLong(dayKey)}` : 'Close out'

  return (
    <>
      <Dialog
        open={view.mode !== 'closed' && !confirmLeave}
        onOpenChange={(open) => {
          if (open) return
          // Leaving keeps the draft, but say so first (design F5.7).
          if (view.mode === 'open') setConfirmLeave(true)
          else close()
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="flex h-dvh max-h-dvh w-full max-w-none flex-col overflow-y-auto rounded-none sm:h-auto sm:max-h-[90dvh] sm:max-w-[720px] sm:rounded-xl"
        >
          <DialogHeader>
            <DialogTitle className="text-lg">{title}</DialogTitle>
          </DialogHeader>
          {view.mode === 'already-closed' ? (
            <AlreadyClosedView
              dayKey={view.dayKey}
              finishedAt={view.finishedAt}
              onCloseAgain={() => startAgain(view.dayKey)}
              onViewReport={close}
            />
          ) : null}
          {view.mode === 'open' ? (
            <CloseoutSteps
              draft={view.draft}
              tasks={tasks}
              companies={companies}
              companiesById={companiesById}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirmLeave}
        title="Leave closeout?"
        description="Your choices so far will be kept."
        confirmLabel="Leave"
        cancelLabel="Keep going"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false)
          close()
        }}
      />
    </>
  )
}
