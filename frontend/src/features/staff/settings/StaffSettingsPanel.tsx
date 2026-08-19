import { Clock3, RotateCw, ShieldCheck, TicketCheck, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { EmailSection } from '@/features/account/components/EmailSection'
import { PasswordSection } from '@/features/account/components/PasswordSection'
import { ProfileSection } from '@/features/account/components/ProfileSection'
import { getAccount } from '@/features/account/account-api'
import { saveStoredUser, type AuthUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

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
      {/* items-stretch (not items-start) so Profile and Staff access match
          each other's height in the row, same as the Super Admin layout. */}
      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
        <ProfileSection user={user} onUserUpdated={setUser} />
        <StaffAccessSummary />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <EmailSection user={user} />
        <PasswordSection user={user} />
      </div>
    </section>
  )
}

const accessItems: { icon: LucideIcon; title: string; text: string; tone: 'sky' | 'violet' | 'emerald' }[] = [
  {
    icon: TicketCheck,
    title: 'Service queue',
    text: 'Claim tickets and appointments while on shift.',
    tone: 'sky',
  },
  {
    icon: Clock3,
    title: 'Shift tracking',
    text: 'Start and end one staff shift per day.',
    tone: 'violet',
  },
  {
    icon: ShieldCheck,
    title: 'Staff replies',
    text: 'Update request status and send requester replies.',
    tone: 'emerald',
  },
]

function StaffAccessSummary() {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b bg-slate-50 px-5 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 text-violet-700">
          <ShieldCheck className="size-5" />
        </div>

        <div>
          <h2 className="font-semibold">Staff access</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your operational permissions inside the staff workspace.
          </p>
        </div>
      </div>

      {/* Flat divide-y list instead of individually-bordered cards - same
          pattern as the Super Admin "Your access" summary. */}
      <div className="flex flex-1 flex-col divide-y">
        {accessItems.map((item) => (
          <SummaryItem key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}

function SummaryItem({
  icon: Icon,
  title,
  text,
  tone,
}: {
  icon: LucideIcon
  title: string
  text: string
  tone: 'sky' | 'violet' | 'emerald'
}) {
  const toneStyles = {
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg border', toneStyles[tone])}>
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}