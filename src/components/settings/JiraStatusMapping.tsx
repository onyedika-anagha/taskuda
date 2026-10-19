import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useJiraStatuses } from '@/hooks/useJiraStatuses'
import { setJiraStatusMap } from '@/services/jira/jiraSettings'
import type { JiraStatusMap } from '@/types/jira'
import { TASK_STATUSES } from '@/types/task'
import { STATUS_LABELS } from '@/utils/taskStatus'

const DONT_CHANGE = '__none'

/** "When a task becomes In Progress, set the Jira issue to: …" (design S7b, PRD AC15.3). */
export function JiraStatusMapping({ map }: { map: JiraStatusMap }) {
  const { statuses, load } = useJiraStatuses()
  const known = statuses.state === 'loaded' ? statuses.statuses : []
  // Keep already-chosen names selectable even before the list loads.
  const options = [...new Set([...known, ...Object.values(map).filter((v): v is string => !!v)])]

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-sm font-medium">Keep Jira statuses in step (optional)</legend>
      {statuses.state === 'idle' || statuses.state === 'loading' ? (
        <Button
          variant="outline"
          className="min-h-11 justify-self-start"
          disabled={statuses.state === 'loading'}
          onClick={() => void load()}
        >
          {statuses.state === 'loading' ? 'Loading statuses…' : 'Load Jira statuses'}
        </Button>
      ) : null}
      {statuses.state === 'failed' ? (
        <p role="alert" className="text-sm text-destructive">
          {statuses.message}
        </p>
      ) : null}
      {options.length > 0
        ? TASK_STATUSES.map((status) => (
            <div key={status} className="grid gap-1.5">
              <Label htmlFor={`jira-map-${status}`}>
                When a task becomes {STATUS_LABELS[status]}, set the Jira issue to:
              </Label>
              <Select
                value={map[status] ?? DONT_CHANGE}
                onValueChange={(value) =>
                  void setJiraStatusMap({ ...map, [status]: value === DONT_CHANGE ? undefined : value })
                }
              >
                <SelectTrigger id={`jira-map-${status}`} className="min-h-11 w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DONT_CHANGE}>Don’t change</SelectItem>
                  {options.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))
        : null}
    </fieldset>
  )
}
