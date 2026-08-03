import { CheckCircle2, Loader2, Save } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateAccountProfile } from '@/features/account/account-api'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import { saveStoredUser, type AuthUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

const roleLabels: Record<AuthUser['role'], string> = {
  user: 'Requester',
  staff: 'Staff',
  super_admin: 'Super Admin',
}

const roleStyles: Record<AuthUser['role'], string> = {
  user: 'bg-sky-100 text-sky-700',
  staff: 'bg-emerald-100 text-emerald-700',
  super_admin: 'bg-violet-100 text-violet-700',
}

function getInitials(name?: string) {
  if (!name) return 'OF'

  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ProfileSection({
  user,
  onUserUpdated,
  className,
}: {
  user: AuthUser
  onUserUpdated: (user: AuthUser) => void
  className?: string
}) {
  const [name, setName] = useState(user.name)
  const [savedName, setSavedName] = useState(user.name)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const normalizedName = name.trim().replace(/\s+/g, ' ')
  const hasChanges = normalizedName !== savedName
  const nameError = useMemo(() => {
    if (!name.length) return ''
    if (normalizedName.length < 2) return 'Enter at least 2 characters.'
    if (normalizedName.length > 255) return 'Name must not exceed 255 characters.'
    return ''
  }, [name, normalizedName])

  useEffect(() => {
    setName(user.name)
    setSavedName(user.name)
  }, [user])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!hasChanges || nameError) return

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await updateAccountProfile({ name: normalizedName })
      setSavedName(response.data.name)
      saveStoredUser(response.data)
      onUserUpdated(response.data)
      setMessage(response.message)
    } catch (profileError) {
      setError(getApiErrorMessage(profileError, 'Unable to update profile.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('overflow-hidden rounded-lg border bg-white shadow-sm', className)}
    >
      <div className="border-b bg-slate-50 px-5 py-4">
        <h2 className="font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the name shown throughout your OfficeFlow workspace.
        </p>
      </div>

      <div className="space-y-5 p-5">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="size-16 shrink-0 rounded-full border object-cover"
              />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full border bg-slate-50 text-lg font-semibold">
                {getInitials(user.name)}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className={cn('border-0', roleStyles[user.role])}>
              {roleLabels[user.role]}
            </Badge>
            {user.role === 'user' && user.requester_type ? (
              <Badge variant="outline" className="capitalize">
                {user.requester_type}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="max-w-2xl space-y-2">
          <Label htmlFor="account-name">Full name</Label>
          <Input
            id="account-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setMessage('')
            }}
            maxLength={255}
            autoComplete="name"
            aria-invalid={Boolean(nameError)}
          />
          {nameError ? <p className="text-xs text-red-600">{nameError}</p> : null}
        </div>

        <div className="flex min-h-9 items-center justify-between gap-3">
          {message ? (
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="size-4" />
              {message}
            </p>
          ) : (
            <span />
          )}

          {hasChanges ? (
            <Button
              type="submit"
              className="cursor-pointer gap-2"
              disabled={isSaving || Boolean(nameError)}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save changes
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  )
}
