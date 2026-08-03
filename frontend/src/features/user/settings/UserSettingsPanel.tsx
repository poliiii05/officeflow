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
    <section className="mx-auto grid max-w-5xl items-start gap-5 lg:grid-cols-12">
      <ProfileSection
        user={user}
        onUserUpdated={setUser}
        className="lg:col-span-7"
      />
      <EmailSection user={user} className="lg:col-span-5" />
      <PasswordSection user={user} className="lg:col-span-12" />
    </section>
  )
}