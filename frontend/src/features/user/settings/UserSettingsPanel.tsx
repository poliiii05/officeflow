import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { EmailSection } from '@/features/account/components/EmailSection'
import { PasswordSection } from '@/features/account/components/PasswordSection'
import { ProfileSection } from '@/features/account/components/ProfileSection'
import { getAccount } from '@/features/account/account-api'
import { saveStoredUser, type AuthUser } from '@/lib/auth-storage'

export function UserSettingsPanel() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAccount() {
      try {
        const account = await getAccount()
        setUser(account)
        saveStoredUser(account)
      } catch {
        setError('Unable to load account settings. Please refresh and try again.')
      }
    }

    void loadAccount()
  }, [])

  if (error) {
    return (
      <div className="mx-auto max-w-6xl rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-44 max-w-6xl items-center justify-center rounded-lg border bg-white text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading settings...
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      {/* Row 1: Profile (main) + Email (sidebar), stretched to matching
          height. Same grid ratio the staff and super admin settings pages
          use, so all three workspaces share one layout. */}
      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
        <ProfileSection user={user} onUserUpdated={setUser} />
        <EmailSection user={user} />
      </div>

      {/* Password flows on its own row so the form has enough width when
          it's active (non-Google accounts render current/new/confirm
          fields). Google-managed accounts render a single card here. */}
      <PasswordSection user={user} />
    </section>
  )
}