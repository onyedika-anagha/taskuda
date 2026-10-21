import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { TodayPage } from '@/pages/TodayPage'

/**
 * Today loads with the app; the other pages are split out and loaded when first opened (NFR3),
 * then cached by the service worker for offline use.
 */
export const routes: RouteObject[] = [
  { path: '/', element: <TodayPage /> },
  { path: '/day/:date', element: <TodayPage /> },
  { path: '/report', lazy: async () => ({ Component: (await import('@/pages/ReportPage')).ReportPage }) },
  {
    path: '/settings',
    lazy: async () => ({ Component: (await import('@/pages/SettingsPage')).SettingsPage }),
  },
  {
    path: '/settings/:section',
    lazy: async () => ({ Component: (await import('@/pages/SettingsPage')).SettingsPage }),
  },
  { path: '/intro', lazy: async () => ({ Component: (await import('@/pages/IntroPage')).IntroPage }) },
  { path: '/welcome', lazy: async () => ({ Component: (await import('@/pages/WelcomePage')).WelcomePage }) },
  { path: '*', element: <Navigate to="/" replace /> },
]

export const router = createBrowserRouter(routes)
