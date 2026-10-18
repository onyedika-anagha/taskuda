import { useRef } from 'react'
import { toast } from 'sonner'
import { RestoreDialogs } from '@/components/backup/RestoreDialogs'
import { Button } from '@/components/ui/button'
import { useRestoreFlow } from '@/hooks/useRestoreFlow'
import { downloadTextFile, exportBackup, readBackupFromFile } from '@/services/backup/exportImport'

/** CR2: export / import the same backup format as a file. */
export function FileBackupPanel() {
  const input = useRef<HTMLInputElement>(null)
  const restore = useRestoreFlow()

  async function exportFile() {
    try {
      const { filename, text } = await exportBackup()
      downloadTextFile(filename, text)
      toast.success('Backup file saved')
    } catch {
      toast.error('Couldn’t create the backup file. Try again.')
    }
  }

  return (
    <section aria-labelledby="file-backup-heading" className="grid gap-3 rounded-lg border bg-card p-4">
      <h3 id="file-backup-heading" className="font-semibold">
        Backup file
      </h3>
      <p className="text-sm text-muted-foreground">
        Save everything to a file you keep, or restore from one. Your keys stay encrypted in the file.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="min-h-11" onClick={() => void exportFile()}>
          Export to file
        </Button>
        <Button variant="outline" className="min-h-11" onClick={() => input.current?.click()}>
          Import from file
        </Button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void restore.start(() => readBackupFromFile(file))
          }}
        />
      </div>
      <RestoreDialogs flow={restore} />
    </section>
  )
}
