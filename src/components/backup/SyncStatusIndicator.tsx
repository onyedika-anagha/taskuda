import {
  CloudAlertIcon,
  CloudCheckIcon,
  CloudOffIcon,
  CloudUploadIcon,
  HardDriveIcon,
  RefreshCwIcon,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useNow } from '@/hooks/useNow'
import { useBackupStore, type BackupStatus } from '@/stores/backupStore'
import { backupStatusText } from '@/utils/backupStatusText'

const ICONS: Record<BackupStatus['state'], LucideIcon> = {
  loading: HardDriveIcon,
  'not-connected': HardDriveIcon,
  idle: CloudCheckIcon,
  'backing-up': CloudUploadIcon,
  offline: CloudOffIcon,
  reconnect: RefreshCwIcon,
  failed: CloudAlertIcon,
}

/** App bar backup status (design SyncStatusIndicator). Text shows from tablet width; phones get the icon. */
export function SyncStatusIndicator() {
  const status = useBackupStore((s) => s.status)
  const backupNow = useBackupStore((s) => s.backupNow)
  const now = useNow()
  const text = backupStatusText(status, now)
  const Icon = ICONS[status.state]
  const label = <span className="hidden lg:inline">{text}</span>

  if (status.state === 'reconnect') {
    return (
      <Button
        variant="outline"
        className="min-h-11"
        aria-label="Reconnect Google"
        onClick={() => void backupNow({ interactive: true })}
      >
        <Icon aria-hidden="true" />
        {label}
      </Button>
    )
  }

  return (
    <Button asChild variant="ghost" className="min-h-11 text-muted-foreground">
      <Link to="/settings/backup" aria-label={`${text}. Backup settings`}>
        <Icon aria-hidden="true" className={status.state === 'failed' ? 'text-destructive' : undefined} />
        {label}
      </Link>
    </Button>
  )
}
