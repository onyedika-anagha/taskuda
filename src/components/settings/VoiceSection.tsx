import { Volume2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useVoiceSettings } from '@/hooks/useVoiceSettings'
import { speak } from '@/services/voice/speechService'
import { setLeadMinutes, setVoiceEnabled, setVoiceURI } from '@/services/voice/voiceSettings'
import { LEAD_MINUTE_OPTIONS, type LeadMinutes } from '@/types/voice'

const DEFAULT_VOICE = 'default'

/** S7e Voice (PRD FR9, AC9.3, AC9.4). */
export function VoiceSection() {
  const { settings, supported, voices } = useVoiceSettings()

  return (
    <section aria-labelledby="voice-heading" className="grid gap-4">
      <h2 id="voice-heading" className="text-lg font-semibold">
        Voice
      </h2>
      {!supported ? (
        <p aria-live="polite" className="rounded-lg border bg-card p-4 text-sm">
          Your browser can’t speak reminders. You’ll still see them on screen.
        </p>
      ) : null}

      {!settings ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-5 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="voice-enabled" className="grid gap-1">
              <span>Spoken reminders</span>
              <span className="text-xs font-normal text-muted-foreground">
                Reminders also show on screen, with or without voice.
              </span>
            </Label>
            <Switch
              id="voice-enabled"
              checked={settings.enabled && supported}
              disabled={!supported}
              onCheckedChange={(checked) => void setVoiceEnabled(checked)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="voice-lead">Remind me before a task starts</Label>
            <Select
              value={String(settings.leadMinutes)}
              onValueChange={(value) => void setLeadMinutes(Number(value) as LeadMinutes)}
            >
              <SelectTrigger id="voice-lead" className="min-h-11 w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_MINUTE_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {minutes === 0 ? 'Off' : `${minutes} minutes`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="voice-choice">Voice</Label>
            <Select
              disabled={!supported || !settings.enabled}
              value={settings.voiceURI ?? DEFAULT_VOICE}
              onValueChange={(value) => void setVoiceURI(value === DEFAULT_VOICE ? null : value)}
            >
              <SelectTrigger id="voice-choice" className="min-h-11 w-full sm:w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_VOICE}>Browser default</SelectItem>
                {voices.map((voice) => (
                  <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="min-h-11 justify-self-start"
            disabled={!supported || !settings.enabled}
            onClick={() => speak('Up next at 2:00 PM: Client call.', settings.voiceURI)}
          >
            <Volume2Icon aria-hidden="true" />
            Play test
          </Button>
        </div>
      )}
    </section>
  )
}
