import { ConfirmDialog } from '@/components/common/ConfirmDialog'

interface ResetSecretsDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ResetSecretsDialog({ open, onConfirm, onCancel }: ResetSecretsDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Reset secrets?"
      description="This removes your AI key and Jira token from this device and your backup, and clears your passphrase. You’ll need to add your keys again. Your tasks aren’t affected."
      confirmLabel="Reset secrets"
      destructive
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
