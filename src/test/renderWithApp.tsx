import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AppProviders } from '@/app/providers'
import { routes } from '@/app/router'

/** Renders the real routes and providers at `path`, like the running app. */
export function renderWithApp(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const user = userEvent.setup()
  const result = render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { ...result, user, router }
}
