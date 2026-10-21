import { BlockTimeLeft } from '@/components/canvas/BlockTimeLeft'
import { RiskMarker } from '@/components/task/RiskMarker'
import { StickyNote } from '@/components/task/StickyNote'
import type { Company } from '@/types/company'
import type { Task } from '@/types/task'

/** Sample notes for the intro illustrations (design Section 10): real components, made-up data. */
const SAMPLE_DAY = '2026-01-05'

const sampleCompany = (id: string, name: string, colorId: string): Company => ({
  id,
  name,
  colorId,
  createdAt: 0,
  updatedAt: 0,
})

const sampleTask = (id: string, title: string, overrides: Partial<Task> = {}): Task => ({
  id,
  title,
  notes: '',
  companyId: null,
  dayKey: SAMPLE_DAY,
  block: 'morning',
  order: 0,
  startTime: null,
  durationMinutes: null,
  status: 'todo',
  carriedOverCount: 0,
  carriedFromTaskId: null,
  carriedToTaskId: null,
  source: 'manual',
  jiraIssue: null,
  seriesId: null,
  dueDate: null,
  dueTime: null,
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
})

const ACME = sampleCompany('acme', 'Acme', 'teal')
const GLOBEX = sampleCompany('globex', 'Globex', 'coral')
const INITECH = sampleCompany('initech', 'Initech', 'violet')

function Note({ task, company }: { task: Task; company: Company }) {
  return (
    <StickyNote
      task={task}
      company={company}
      readOnly
      onOpen={() => {}}
      onCycleStatus={() => {}}
      today={SAMPLE_DAY}
    />
  )
}

export function NotesIllustration() {
  return (
    <div className="grid gap-3">
      <Note task={sampleTask('a', 'Client call', { companyId: 'acme', startTime: '09:30' })} company={ACME} />
      <Note
        task={sampleTask('b', 'Fix login bug', { companyId: 'globex', status: 'in_progress' })}
        company={GLOBEX}
      />
      <Note
        task={sampleTask('c', 'Send invoice', { companyId: 'initech', status: 'done' })}
        company={INITECH}
      />
    </div>
  )
}

export function BlocksIllustration() {
  return (
    <div className="grid gap-3">
      <p className="flex items-baseline gap-2 font-semibold">
        Afternoon
        <BlockTimeLeft minutesLeft={80} className="ml-auto" />
      </p>
      <Note
        task={sampleTask('d', 'Design review', { companyId: 'acme', startTime: '14:00' })}
        company={ACME}
      />
      <RiskMarker kind="running_late" label="Running late · 2:00 PM" className="justify-self-start border" />
    </div>
  )
}

export function CloseoutIllustration() {
  return (
    <div className="grid gap-3">
      <Note
        task={sampleTask('e', 'Write onboarding doc', { companyId: 'globex', carriedOverCount: 1 })}
        company={GLOBEX}
      />
      <div className="grid grid-cols-2 gap-2 text-center text-sm font-medium">
        <span className="rounded-md border bg-card py-2">Carry over</span>
        <span className="rounded-md border py-2 text-muted-foreground">Delete</span>
      </div>
    </div>
  )
}

export function ReportIllustration() {
  return (
    <pre className="overflow-hidden rounded-lg border bg-card p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">
      {
        '5 done · 2 in progress, across 3 companies\n\n*Acme*\n• Client call ✓\n• Design review ✓\n\n*Globex*\n• Fix login bug (in progress)'
      }
    </pre>
  )
}
