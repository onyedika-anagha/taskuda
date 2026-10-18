import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useCompanyActions } from '@/hooks/useCompanyActions'
import { useCompanyTaskCount } from '@/hooks/useCompanyTaskCount'
import type { Company } from '@/types/company'

interface DeleteCompanyDialogProps {
  company: Company | null
  onClose: () => void
}

function describe(company: Company, taskCount: number): string {
  if (taskCount === 0) return 'No tasks are tagged with this company.'
  const tasks = taskCount === 1 ? '1 task is' : `${taskCount} tasks are`
  return `${tasks} tagged with ${company.name}. They’ll keep their content but lose the company tag.`
}

/** D3: never deletes tasks; tagged tasks just lose the tag (PRD AC5.3). */
export function DeleteCompanyDialog({ company, onClose }: DeleteCompanyDialogProps) {
  const actions = useCompanyActions()
  const taskCount = useCompanyTaskCount(company?.id)
  const ready = !!company && taskCount !== undefined

  return (
    <ConfirmDialog
      open={ready}
      title={company ? `Delete ${company.name}?` : ''}
      description={ready ? describe(company, taskCount) : ''}
      confirmLabel="Delete company"
      destructive
      onCancel={onClose}
      onConfirm={() => {
        if (company) void actions.deleteCompany(company)
        onClose()
      }}
    />
  )
}
