import { Clock3, ShieldCheck, TicketCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import { EmailSection } from '@/features/account/components/EmailSection'
import { PasswordSection } from '@/features/account/components/PasswordSection'
import { ProfileSection } from '@/features/account/components/ProfileSection'
import { getAccount } from '@/features/account/account-api'
import { saveStoredUser, type AuthUser } from '@/lib/auth-storage'

export function StaffSettingsPanel() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAccount() {
      try {
        const account = await getAccount()
        setUser(account)
        saveStoredUser(account)
      } catch {
        setError('Unable to load staff settings.')
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
      <StaffAccessSummary />
      <EmailSection user={user} />
      <PasswordSection user={user} />
    </section>
  )
}

function StaffAccessSummary() {
  return (
    <section className="grid gap-4 rounded-lg border bg-white p-5 shadow-sm lg:grid-cols-3">
      <SummaryItem icon={TicketCheck} title="Service queue" text="Can claim tickets and appointments while on shift." />
      <SummaryItem icon={Clock3} title="Shift tracking" text="Can start and end shifts from the staff workspace." />
      <SummaryItem icon={ShieldCheck} title="Staff access" text="Can update request status and reply to requesters." />
    </section>
  )
}

function SummaryItem({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof TicketCheck
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