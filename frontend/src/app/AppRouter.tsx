import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}