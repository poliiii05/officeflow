import { Database, Loader2, ShieldCheck, Users, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { EmailSection } from '@/features/account/components/EmailSection'
import { PasswordSection } from '@/features/account/components/PasswordSection'
import { ProfileSection } from '@/features/account/components/ProfileSection'
import { getAccount } from '@/features/account/account-api'
import { saveStoredUser, type AuthUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

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
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-white p-5 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading settings...
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      {/* Row 1: Profile (main) + Your access (sidebar). Both are grid items
          in the same row, so they stretch to match each other's height
          automatically - no fixed height needed. */}
      <div className="grid items-stretch gap-5 xl:grid-cols-[1fr_360px]">
        <ProfileSection user={user} onUserUpdated={setUser} />
        <SuperAdminAccessSummary />
      </div>

      {/* Row 2: Email + Password side by side, equal width. */}
      <div className="grid gap-5 md:grid-cols-2">
        <EmailSection user={user} />
        <PasswordSection user={user} />
      </div>
    </section>
  )
}

const accessItems: {
  icon: LucideIcon
  title: string
  text: string
  tone: 'violet' | 'sky' | 'emerald'
}[] = [
  {
    icon: Users,
    title: 'User control',
    text: 'Can review users and manage role access.',
    tone: 'violet',
  },
  {
    icon: Database,
    title: 'System records',
    text: 'Can view audit logs, analytics, and queue history.',
    tone: 'sky',
  },
  {
    icon: ShieldCheck,
    title: 'Full access',
    text: 'Can update system-wide settings and maintenance mode.',
    tone: 'emerald',
  },
]

function SuperAdminAccessSummary() {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b bg-slate-50 px-5 py-4">
        <IconBox icon={ShieldCheck} tone="violet" />

        <div>
          <h2 className="font-semibold">Your access</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What the Super Admin role can do.
          </p>
        </div>
      </div>

      {/* Single column - this section now lives in a ~360px sidebar next to
          Profile, too narrow for the old 3-column grid. */}
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
  tone: 'violet' | 'sky' | 'emerald'
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <IconBox icon={Icon} tone={tone} size="sm" />
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}

function IconBox({
  icon: Icon,
  tone,
  size = 'md',
}: {
  icon: LucideIcon
  tone: 'violet' | 'sky' | 'emerald'
  size?: 'sm' | 'md'
}) {
  const toneStyles = {
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg border bg-white',
        size === 'sm' ? 'size-9' : 'size-10',
        toneStyles[tone]
      )}
    >
      <Icon className={size === 'sm' ? 'size-4' : 'size-5'} />
    </div>
  )
}