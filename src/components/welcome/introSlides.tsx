import type { ReactNode } from 'react'
import {
  BlocksIllustration,
  CloseoutIllustration,
  NotesIllustration,
  ReportIllustration,
} from './IntroIllustrations'

export interface IntroSlideContent {
  title: string
  body: string
  illustration: ReactNode
}

/** Design Section 8, S1a. */
export const INTRO_SLIDES: IntroSlideContent[] = [
  {
    title: 'One board for every job.',
    body: 'Each employer gets a color, and every task is a sticky note, so you can see whose work is whose at a glance.',
    illustration: <NotesIllustration />,
  },
  {
    title: 'Plan by time of day.',
    body: 'Put tasks in Morning, Afternoon or Evening. Taskuda reminds you before timed tasks start and flags work that’s slipping.',
    illustration: <BlocksIllustration />,
  },
  {
    title: 'Close out. Drop nothing.',
    body: 'At the end of the day, decide what happens to every unfinished task. Whatever you carry over is waiting for you on your next working day.',
    illustration: <CloseoutIllustration />,
  },
  {
    title: 'Your report, ready to send.',
    body: 'Copy an end-of-day report for Slack, Teams, Jira or email in one click. Your tasks stay on this device and in your own Google Drive.',
    illustration: <ReportIllustration />,
  },
]
