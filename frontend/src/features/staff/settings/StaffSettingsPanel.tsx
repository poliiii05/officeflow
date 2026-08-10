import { Clock3, RotateCw, ShieldCheck, TicketCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { EmailSection } from '@/features/account/components/EmailSection'
import { PasswordSection } from '@/features/account/components/PasswordSection'
import { ProfileSection } from '@/features/account/components/ProfileSection'
import { getAccount } from '@/features/account/account-api'
import { saveStoredUser, type AuthUser } from '@/lib/auth-storage'

export function StaffSettingsPanel() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadAccount = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const account = await getAccount()
      setUser(account)
      saveStoredUser(account)
    } catch {
      setError('Unable to load staff settings.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAccount()
  }, [loadAccount])

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border bg-white p-5 text-sm text-red-700">
        <p>{error}</p>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer gap-2"
          disabled={isLoading}
          onClick={() => void loadAccount()}
        >
          <RotateCw className={isLoading ? 'size-4 animate-spin' : 'size-4'} />
          Try again
        </Button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-lg border bg-white p-5 text-sm text-muted-foreground">
        Loading settings...
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-7xl space-y-5">
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
        <div className="space-y-5">
          <ProfileSection user={user} onUserUpdated={setUser} />
          <PasswordSection user={user} />
        </div>

        <div className="space-y-5">
          <EmailSection user={user} />
          <StaffAccessSummary />
        </div>
      </div>
    </section>
  )
}

function StaffAccessSummary() {
  return (
    <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="border-b bg-slate-50 px-5 py-4">
        <h2 className="font-semibold">Staff access</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your operational permissions inside the staff workspace.
        </p>
      </div>

      <div className="grid gap-3 p-5">
        <SummaryItem
          icon={TicketCheck}
          title="Service queue"
          text="Claim tickets and appointments while on shift."
        />
        <SummaryItem
          icon={Clock3}
          title="Shift tracking"
          text="Start and end one staff shift per day."
        />
        <SummaryItem
          icon={ShieldCheck}
          title="Staff replies"
          text="Update request status and send requester replies."
        />
      </div>
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
    <div className="flex gap-3 rounded-lg border bg-slate-50 p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700">
        <Icon className="size-4" />
      </div>

      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}