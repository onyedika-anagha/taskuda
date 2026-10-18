import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { ReportPage } from '@/pages/ReportPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TodayPage } from '@/pages/TodayPage'
import { WelcomePage } from '@/pages/WelcomePage'

export const routes: RouteObject[] = [
  { path: '/', element: <TodayPage /> },
  { path: '/day/:date', element: <TodayPage /> },
  { path: '/report', element: <ReportPage /> },
  { path: '/settings', element: <Navigate to="/settings/companies" replace /> },
  { path: '/settings/:section', element: <SettingsPage /> },
  { path: '/welcome', element: <WelcomePage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]

export const router = createBrowserRouter(routes)
