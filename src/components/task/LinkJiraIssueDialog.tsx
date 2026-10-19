import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormField } from '@/components/common/FormField'
import { ResponsiveDialog } from '@/components/common/ResponsiveDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useJiraSettings } from '@/hooks/useJiraSettings'
import { linkIssueSchema, type LinkIssueValues } from '@/schemas/jiraForm'
import { parseIssueKey } from '@/services/jira/jiraClient'
import { lookUpIssue } from '@/services/jira/jiraService'
import { useVaultStore } from '@/stores/vaultStore'
import type { JiraIssueLink } from '@/types/task'
import { fieldDescribedBy } from '@/utils/formAria'
import { jiraErrorMessage } from '@/utils/jiraErrorMessages'

interface LinkJiraIssueDialogProps {
  open: boolean
  onClose: () => void
  onLink: (issue: JiraIssueLink) => void
}

/** D7 Link Jira Issue: key or URL → look up → preview → Link (PRD AC15.2). */
export function LinkJiraIssueDialog({ open, onClose, onLink }: LinkJiraIssueDialogProps) {
  const jira = useJiraSettings()
  const ensureUnlocked = useVaultStore((s) => s.ensureUnlocked)
  const [preview, setPreview] = useState<JiraIssueLink | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LinkIssueValues>({ resolver: zodResolver(linkIssueSchema), defaultValues: { issue: '' } })

  function close() {
    reset()
    setPreview(null)
    onClose()
  }

  async function lookUp({ issue }: LinkIssueValues) {
    setPreview(null)
    try {
      if (!(await ensureUnlocked())) return
      setPreview(await lookUpIssue(issue))
    } catch (error) {
      const key = parseIssueKey(issue) ?? undefined
      setError(
        'issue',
        { message: jiraErrorMessage(error, { key, site: jira?.site }) },
        { shouldFocus: true },
      )
    }
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !next && close()}
      title="Link a Jira issue"
      description="Paste an issue key (ABC-123) or link."
    >
      <form
        noValidate
        className="grid gap-4"
        onSubmit={(event) => {
          // Rendered inside the task editor's form in React's tree: don't submit that one too.
          event.stopPropagation()
          void handleSubmit(lookUp)(event)
        }}
      >
        <FormField id="jira-issue" label="Issue" error={errors.issue?.message}>
          <Input
            id="jira-issue"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!errors.issue}
            aria-describedby={fieldDescribedBy('jira-issue', errors.issue?.message)}
            {...register('issue')}
          />
        </FormField>

        {preview ? (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm" aria-live="polite">
            <p className="font-mono font-medium">{preview.key}</p>
            <p>{preview.title}</p>
            <p className="text-muted-foreground">Status: {preview.status}</p>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="lg" onClick={close}>
            Cancel
          </Button>
          {preview ? (
            <Button
              type="button"
              size="lg"
              onClick={() => {
                onLink(preview)
                close()
              }}
            >
              Link
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Looking up issue…' : 'Look up'}
            </Button>
          )}
        </div>
      </form>
    </ResponsiveDialog>
  )
}
