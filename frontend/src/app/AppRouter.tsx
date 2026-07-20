import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { DashboardPage } from '@/pages/DashboardPage'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}