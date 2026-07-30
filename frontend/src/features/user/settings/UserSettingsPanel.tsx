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
        setError('Unable to load account settings.')
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
      <ProfileSection user={user} onUserUpdated={setUser} allowRequesterType />
      <EmailSection user={user} />
      <PasswordSection user={user} />
    </section>
  )
}   