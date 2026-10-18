import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TodayPage } from './TodayPage'

describe('TodayPage', () => {
  it('renders the app heading', () => {
    render(<TodayPage />)
    expect(screen.getByRole('heading', { name: 'Taskuda' })).toBeInTheDocument()
  })
})
