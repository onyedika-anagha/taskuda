import { useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useJiraConnect } from '@/hooks/useJiraConnect'
import { useJiraSettings } from '@/hooks/useJiraSettings'
import { JiraConnectForm } from './JiraConnectForm'
import { JiraStatusMapping } from './JiraStatusMapping'

/** S7b Jira card (PRD FR15, design F12). */
export function JiraCard() {
  const settings = useJiraSettings()
  const jira = useJiraConnect()
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  return (
    <section aria-labelledby="jira-heading" className="grid gap-3 rounded-lg border bg-card p-4">
      <h3 id="jira-heading" className="font-semibold">
        Jira
      </h3>
      <p className="text-sm text-muted-foreground">Link tasks to Jira issues and keep statuses in step.</p>

      {!settings ? <Skeleton className="h-11 w-full" /> : null}
      {settings && !settings.connected ? (
        <JiraConnectForm error={jira.error} onConnect={jira.connect} />
      ) : null}
      {settings?.connected ? (
        <>
          <p className="text-sm">
            Connected to <span className="font-medium">{settings.site}</span>
            {settings.displayName ? ` as ${settings.displayName}` : ''}.
          </p>
          <JiraStatusMapping map={settings.statusMap} />
          <Button
            variant="ghost"
            className="min-h-11 justify-self-start"
            onClick={() => setConfirmDisconnect(true)}
          >
            Disconnect
          </Button>
        </>
      ) : null}

      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect Jira?"
        description="Your Jira token is removed from this device and your backup. Issues already linked stay on your tasks."
        confirmLabel="Disconnect"
        onCancel={() => setConfirmDisconnect(false)}
        onConfirm={() => {
          setConfirmDisconnect(false)
          void jira.disconnect()
        }}
      />
    </section>
  )
}
