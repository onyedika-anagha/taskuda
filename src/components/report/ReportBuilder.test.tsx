import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makeCompany, makeTask } from '@/test/factories'
import { ReportBuilder } from './ReportBuilder'

const DAY = '2026-10-19'
const tasks = [
  makeTask({ id: '1', title: 'Ship login', companyId: 'acme', status: 'done' }),
  makeTask({ id: '2', title: 'Write spec', companyId: 'north', status: 'done' }),
]
const companies = [makeCompany({ id: 'acme', name: 'Acme' }), makeCompany({ id: 'north', name: 'Northwind' })]

function renderBuilder(onCopied = vi.fn<(at: number) => void>(), list = tasks) {
  const user = userEvent.setup()
  render(<ReportBuilder dayKey={DAY} tasks={list} companies={companies} onCopied={onCopied} />)
  return { user, onCopied }
}

describe('ReportBuilder (S6)', () => {
  it('AC14.3 / DAC5 copies with one click and confirms', async () => {
    const { user, onCopied } = renderBuilder()
    await user.click(screen.getByRole('button', { name: 'Copy report' }))
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
    expect(onCopied).toHaveBeenCalledTimes(1)
    expect(await navigator.clipboard.readText()).toContain('*End-of-day report · Monday, Oct 19*')
  })

  it('AC14.2 switching format changes the preview', async () => {
    const { user } = renderBuilder()
    await user.click(screen.getByRole('radio', { name: 'Email' }))
    expect(screen.getByLabelText('Preview')).toHaveValue(
      'End-of-day report · Monday, Oct 19\n\n2 done, across 2 companies\n\nACME\n\nDone:\n- Ship login\n\nNORTHWIND\n\nDone:\n- Write spec',
    )
  })

  it('AC14.1 reports a single company', async () => {
    const { user } = renderBuilder()
    await user.click(screen.getByLabelText('Companies'))
    await user.click(await screen.findByRole('option', { name: 'Northwind' }))
    const { value } = screen.getByLabelText<HTMLTextAreaElement>('Preview')
    expect(value).toContain('End-of-day report · Northwind')
    expect(value).toContain('Write spec')
    expect(value).not.toContain('Ship login')
  })

  it('F5.5 blocked clipboard: explains and selects the text for manual copy', async () => {
    const { user, onCopied } = renderBuilder()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'))
    await user.click(screen.getByRole('button', { name: 'Copy report' }))
    expect(
      await screen.findByText(
        'Couldn’t copy automatically. The text is selected — press Ctrl+C (⌘C on Mac) to copy it.',
      ),
    ).toBeInTheDocument()
    const preview = screen.getByLabelText<HTMLTextAreaElement>('Preview')
    expect(preview).toHaveFocus()
    expect(preview.selectionEnd - preview.selectionStart).toBe(preview.value.length)
    expect(onCopied).not.toHaveBeenCalled()
  })

  it('empty report: says so and disables copy', () => {
    renderBuilder(undefined, [makeTask({ status: 'todo' })])
    expect(
      screen.getByText('Nothing to report yet. Mark tasks done and they’ll show up here.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy report' })).toBeDisabled()
  })
})
