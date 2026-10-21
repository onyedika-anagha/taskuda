import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AiModelField } from './AiModelField'

const setAiModel = vi.hoisted(() => vi.fn<(provider: string, model: string) => Promise<void>>())
vi.mock('@/services/ai/aiSettings', () => ({ setAiModel }))

describe('AiModelField', () => {
  it('saves each change even when the stored value hasn’t caught up yet', async () => {
    // `value` stays at the default, as if the live query were still behind the first save.
    render(<AiModelField provider="gemini" value="gemini-3.5-flash-lite" />)
    const model = screen.getByLabelText('Model')
    await userEvent.clear(model)
    await userEvent.type(model, 'gemini-3.8-flash')
    await userEvent.tab()
    await userEvent.clear(model)
    await userEvent.tab()
    expect(setAiModel.mock.calls).toEqual([
      ['gemini', 'gemini-3.8-flash'],
      ['gemini', 'gemini-3.5-flash-lite'],
    ])
    expect(model).toHaveValue('gemini-3.5-flash-lite')
  })

  it('takes a change made elsewhere, such as a restore', () => {
    const { rerender } = render(<AiModelField provider="gemini" value="gemini-3.5-flash-lite" />)
    rerender(<AiModelField provider="gemini" value="gemini-restored" />)
    expect(screen.getByLabelText('Model')).toHaveValue('gemini-restored')
  })
})
