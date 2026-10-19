import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useJiraSettings } from '@/hooks/useJiraSettings'
import type { JiraIssueLink } from '@/types/task'
import { LinkJiraIssueDialog } from './LinkJiraIssueDialog'

interface JiraIssueFieldProps {
  value: JiraIssueLink | null
  onChange: (issue: JiraIssueLink | null) => void
}

/** Task editor's "Jira issue (optional)": shown when Jira is connected or the task is already linked. */
export function JiraIssueField({ value, onChange }: JiraIssueFieldProps) {
  const jira = useJiraSettings()
  const [linking, setLinking] = useState(false)
  if (!value && !jira?.connected) return null

  return (
    <div className="grid gap-1.5">
      <Label asChild>
        <span>Jira issue (optional)</span>
      </Label>
      {value ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm">
          <span className="font-mono font-medium">{value.key}</span>
          <span className="min-w-0 flex-1 truncate">{value.title}</span>
          <span className="text-muted-foreground">{value.status}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11"
            aria-label={`Unlink ${value.key}`}
            onClick={() => onChange(null)}
          >
            Unlink
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 justify-self-start"
          onClick={() => setLinking(true)}
        >
          Link Jira issue
        </Button>
      )}
      <LinkJiraIssueDialog open={linking} onClose={() => setLinking(false)} onLink={onChange} />
    </div>
  )
}
