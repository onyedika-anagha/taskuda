import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useIntroCarousel } from '@/hooks/useIntroCarousel'
import { IntroSlide } from './IntroSlide'
import { INTRO_SLIDES } from './introSlides'

interface IntroCarouselProps {
  /** First run offers setup and restore at the end; replay just closes. */
  mode: 'first-run' | 'replay'
  /** Skip, Get started and Done. */
  onFinish: () => void
  /** "I already use Taskuda" (first run only). */
  onRestore?: () => void
}

/** S1a Intro (PRD FR33, design F1 and F20). */
export function IntroCarousel({ mode, onFinish, onRestore }: IntroCarouselProps) {
  const carousel = useIntroCarousel(INTRO_SLIDES.length)
  const slide = INTRO_SLIDES[carousel.index]

  return (
    <section
      aria-roledescription="carousel"
      aria-label="About Taskuda"
      {...carousel.swipe}
      className="flex min-h-full flex-1 flex-col gap-8"
    >
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-sm font-bold tracking-tight">Taskuda</h1>
        {/* On every slide (PRD AC33.2). */}
        <Button variant="ghost" className="min-h-11" onClick={onFinish}>
          Skip
        </Button>
      </div>

      <div className="flex flex-1 items-center">
        <IntroSlide
          key={carousel.index}
          slide={slide}
          number={carousel.index + 1}
          count={INTRO_SLIDES.length}
        />
      </div>

      <div className="grid gap-4 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-center">
          {INTRO_SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === carousel.index ? 'step' : undefined}
              onClick={() => carousel.goTo(i)}
              className="grid size-11 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'size-2 rounded-full transition-colors',
                  i === carousel.index ? 'bg-foreground' : 'bg-foreground/25',
                )}
              />
            </button>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          {carousel.isFirst ? null : (
            <Button variant="outline" size="lg" onClick={carousel.back} className="sm:mr-auto">
              Back
            </Button>
          )}
          {!carousel.isLast ? (
            <Button size="lg" onClick={carousel.next} className="sm:ml-auto">
              Next
            </Button>
          ) : mode === 'first-run' ? (
            <>
              <Button variant="outline" size="lg" onClick={onRestore} className="sm:ml-auto">
                I already use Taskuda
              </Button>
              <Button size="lg" onClick={onFinish}>
                Get started
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={onFinish} className="sm:ml-auto">
              Done
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
