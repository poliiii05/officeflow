import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { logoutUser } from '@/features/auth/auth-api'
import { Button } from '@/components/ui/button'
import { getStoredUser } from '@/lib/auth-storage'

export function DashboardPage() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logoutUser()
    } finally {
      navigate('/login', { replace: true })
      setIsLoggingOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl rounded-xl border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <h1 className="mt-1 text-2xl font-semibold">
              {user?.name ?? 'OfficeFlow User'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Role: {user?.role ?? 'user'} · Type: {user?.requester_type ?? 'N/A'}
            </p>
          </div>

          <Button
            className="cursor-pointer"
            variant="outline"
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="size-4" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>

        <div className="mt-8 rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium">Dashboard placeholder</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We will build user requests, appointments, tickets, and staff dashboards in the next phases.
          </p>
        </div>

        <Link
          to="/"
          className="mt-6 inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted hover:text-foreground"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}