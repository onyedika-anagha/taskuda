import { RouterProvider } from 'react-router'
import { UpdatePrompt } from '@/components/layout/UpdatePrompt'
import { AppProviders } from './providers'
import { router } from './router'

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <UpdatePrompt />
    </AppProviders>
  )
}
