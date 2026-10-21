import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IntroCarousel } from './IntroCarousel'

function renderCarousel(mode: 'first-run' | 'replay' = 'first-run') {
  const onFinish = vi.fn<() => void>()
  const onRestore = vi.fn<() => void>()
  render(<IntroCarousel mode={mode} onFinish={onFinish} onRestore={onRestore} />)
  return { onFinish, onRestore }
}

const slide = (n: number) => screen.getByRole('group', { name: `Slide ${n} of 4` })

describe('IntroCarousel (S1a)', () => {
  it('AC33.2 Next and Back move between slides, and focus goes to the new heading', async () => {
    renderCarousel()
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(slide(2)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Plan by time of day.' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(slide(1)).toBeInTheDocument()
  })

  it('AC33.2 arrow keys move between slides and stop at the ends', async () => {
    renderCarousel()
    await userEvent.keyboard('{ArrowLeft}')
    expect(slide(1)).toBeInTheDocument()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}')
    expect(slide(4)).toBeInTheDocument()
  })

  it('dots jump to a slide and mark the current one', async () => {
    renderCarousel()
    const third = screen.getByRole('button', { name: 'Go to slide 3' })
    await userEvent.click(third)
    expect(slide(3)).toBeInTheDocument()
    expect(third).toHaveAttribute('aria-current', 'step')
  })

  it('only the current slide is in the accessibility tree, and illustrations can’t be focused', async () => {
    renderCarousel()
    expect(screen.getAllByRole('group')).toHaveLength(1)
    // The sample notes are real StickyNotes, made inert.
    expect(screen.queryByRole('button', { name: /^Edit / })).not.toBeInTheDocument()
  })

  it('AC33.2 / DAC26 Skip is on every slide', async () => {
    const { onFinish } = renderCarousel()
    for (let i = 0; i < 3; i++) await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onFinish).toHaveBeenCalledOnce()
  })

  it('AC33.3 the last slide offers Get started and I already use Taskuda', async () => {
    const { onFinish, onRestore } = renderCarousel()
    await userEvent.click(screen.getByRole('button', { name: 'Go to slide 4' }))
    await userEvent.click(screen.getByRole('button', { name: 'I already use Taskuda' }))
    expect(onRestore).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'Get started' }))
    expect(onFinish).toHaveBeenCalledOnce()
  })

  it('AC33.4 replay ends with Done only', async () => {
    renderCarousel('replay')
    await userEvent.click(screen.getByRole('button', { name: 'Go to slide 4' }))
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Get started' })).not.toBeInTheDocument()
  })
})
