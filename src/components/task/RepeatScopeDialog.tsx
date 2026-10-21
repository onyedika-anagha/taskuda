import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { RepeatScope } from '@/services/db/seriesRepository'

interface RepeatScopeDialogProps {
  open: boolean
  title: string
  description: string
  destructive?: boolean
  onChoose: (scope: RepeatScope) => void
  onCancel: () => void
}

/** "This task only" / "This and future tasks" / Cancel: D8 and the repeating variant of D1 (PRD AC20.5). */
export function RepeatScopeDialog({
  open,
  title,
  description,
  destructive = false,
  onChoose,
  onCancel,
}: RepeatScopeDialogProps) {
  const variant = destructive ? 'destructive' : 'default'
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="outline" onClick={() => onChoose('future')}>
            This and future tasks
          </AlertDialogAction>
          <AlertDialogAction variant={variant} onClick={() => onChoose('this')}>
            This task only
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
