import { Database, ShieldCheck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

import { EmailSection } from '@/features/account/components/EmailSection'
import { PasswordSection } from '@/features/account/components/PasswordSection'
import { ProfileSection } from '@/features/account/components/ProfileSection'
import { getAccount } from '@/features/account/account-api'
import { saveStoredUser, type AuthUser } from '@/lib/auth-storage'

export function SuperAdminAccountSettingsPanel() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAccount() {
      try {
        const account = await getAccount()
        setUser(account)
        saveStoredUser(account)
      } catch {
        setError('Unable to load super admin account settings.')
      }
    }

    void loadAccount()
  }, [])

  if (error) {
    return <div className="rounded-lg border bg-white p-5 text-sm text-red-700">{error}</div>
  }

  if (!user) {
    return <div className="rounded-lg border bg-white p-5 text-sm text-muted-foreground">Loading settings...</div>
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <ProfileSection user={user} onUserUpdated={setUser} />
      <SuperAdminAccessSummary />
      <EmailSection user={user} />
      <PasswordSection user={user} />
    </section>
  )
}

function SuperAdminAccessSummary() {
  return (
    <section className="grid gap-4 rounded-lg border bg-white p-5 shadow-sm lg:grid-cols-3">
      <SummaryItem icon={Users} title="User control" text="Can review users and manage role access." />
      <SummaryItem icon={Database} title="System records" text="Can view audit logs, analytics, and queue history." />
      <SummaryItem icon={ShieldCheck} title="Full access" text="Can update system-wide settings and maintenance mode." />
    </section>
  )
}

function SummaryItem({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Users
  title: string
  text: string
}) {
  return (
    <div className="rounded-lg border bg-slate-50 p-4">
      <Icon className="size-5 text-slate-700" />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  )
}