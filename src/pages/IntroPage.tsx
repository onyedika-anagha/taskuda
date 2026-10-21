import { useNavigate } from 'react-router'
import { IntroCarousel } from '@/components/welcome/IntroCarousel'

/** S1a replay from Settings → About (PRD AC33.4, design F20). Changes no data. */
export function IntroPage() {
  const navigate = useNavigate()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6">
      <IntroCarousel mode="replay" onFinish={() => navigate('/settings/about', { replace: true })} />
    </main>
  )
}
