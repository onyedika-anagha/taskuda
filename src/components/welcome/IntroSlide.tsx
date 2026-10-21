import { INTRO_HEADING_ID } from '@/hooks/useIntroCarousel'
import type { IntroSlideContent } from './introSlides'

interface IntroSlideProps {
  slide: IntroSlideContent
  number: number
  count: number
}

/** One S1a slide. The illustration is real Taskuda UI, made inert so it can't be focused or read. */
export function IntroSlide({ slide, number, count }: IntroSlideProps) {
  return (
    // A fieldset is a group without the role attribute (WAI carousel pattern: one group per slide).
    <fieldset
      aria-roledescription="slide"
      aria-label={`Slide ${number} of ${count}`}
      className="m-0 grid min-w-0 gap-8 border-0 p-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300 lg:grid-cols-2 lg:items-center"
    >
      <div inert aria-hidden="true" className="pointer-events-none mx-auto w-full max-w-sm select-none">
        {slide.illustration}
      </div>
      <div className="grid gap-3">
        <h2
          id={INTRO_HEADING_ID}
          tabIndex={-1}
          className="text-3xl font-semibold tracking-tight outline-none"
        >
          {slide.title}
        </h2>
        <p className="text-base text-muted-foreground">{slide.body}</p>
      </div>
    </fieldset>
  )
}
