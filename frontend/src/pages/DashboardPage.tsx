import { Link } from 'react-router-dom'

import { getStoredUser } from '@/lib/auth-storage'

export function DashboardPage() {
  const user = getStoredUser()

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl rounded-xl border bg-background p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {user?.name ?? 'OfficeFlow User'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Role: {user?.role ?? 'user'} · Type: {user?.requester_type ?? 'N/A'}
        </p>

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