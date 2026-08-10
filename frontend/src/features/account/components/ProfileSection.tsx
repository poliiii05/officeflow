import { CheckCircle2, Loader2, Save, UserRound, X } from 'lucide-react'
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

function normalizeLabel(value: string) {
  return value.replace(/_/g, ' ')
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
  const [nickname, setNickname] = useState(user.nickname ?? '')
  const [savedName, setSavedName] = useState(user.name)
  const [savedNickname, setSavedNickname] = useState(user.nickname ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)

  const normalizedName = name.trim().replace(/\s+/g, ' ')
  const normalizedNickname = nickname.trim().replace(/\s+/g, ' ')
  const visibleName = savedNickname || savedName
  const hasChanges = normalizedName !== savedName || normalizedNickname !== savedNickname

  const nameError = useMemo(() => {
    if (!normalizedName.length) return 'Name is required.'
    if (normalizedName.length < 2) return 'Enter at least 2 characters.'
    if (normalizedName.length > 255) return 'Name must not exceed 255 characters.'
    return ''
  }, [normalizedName])

  const nicknameError = useMemo(() => {
    if (!normalizedNickname) return ''
    if (normalizedNickname.length > 80) return 'Display name must not exceed 80 characters.'
    if (!/^[\p{L}\p{N} ._-]+$/u.test(normalizedNickname)) {
      return 'Use letters, numbers, spaces, dots, hyphens, or underscores only.'
    }

    return ''
  }, [normalizedNickname])

  useEffect(() => {
    setName(user.name)
    setNickname(user.nickname ?? '')
    setSavedName(user.name)
    setSavedNickname(user.nickname ?? '')
    setAvatarFailed(false)
  }, [user])

  function resetToSaved() {
    setName(savedName)
    setNickname(savedNickname)
    setMessage('')
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!hasChanges || nameError || nicknameError) return

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await updateAccountProfile({
        name: normalizedName,
        nickname: normalizedNickname || null,
      })

      setSavedName(response.data.name)
      setSavedNickname(response.data.nickname ?? '')
      saveStoredUser(response.data)
      onUserUpdated(response.data)
      window.dispatchEvent(new CustomEvent('officeflow:user-updated', { detail: response.data }))
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
      <div className="flex items-start gap-3 border-b bg-slate-50 px-5 py-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <UserRound className="size-5" />
        </div>

        <div>
          <h2 className="font-semibold">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account name, display name, and workspace identity.
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {error ? (
          <p
            id="profile-form-error"
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {user.avatar_url && !avatarFailed ? (
              <img
                src={user.avatar_url}
                alt={visibleName}
                className="size-16 shrink-0 rounded-full border object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full border bg-slate-50 text-lg font-semibold">
                {getInitials(visibleName)}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-base font-medium">{visibleName}</p>
              {savedNickname ? (
                <p className="truncate text-sm text-muted-foreground">{savedName}</p>
              ) : null}
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className={cn('border-0', roleStyles[user.role])}>
              {roleLabels[user.role]}
            </Badge>

            {user.role === 'user' && user.requester_type ? (
              <Badge variant="outline" className="capitalize">
                {normalizeLabel(user.requester_type)}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="account-name">Full name</Label>
            <Input
              id="account-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setMessage('')
                setError('')
              }}
              maxLength={255}
              autoComplete="name"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? 'account-name-error' : undefined}
            />

            {nameError ? (
              <p id="account-name-error" className="text-xs text-red-600">
                {nameError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2" data-tour="staff-display-name">
            <Label htmlFor="account-display-name">Display name</Label>
            <Input
              id="account-display-name"
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value)
                setMessage('')
                setError('')
              }}
              maxLength={80}
              placeholder="Example: John, Front Desk Lead"
              aria-invalid={Boolean(nicknameError)}
              aria-describedby={nicknameError ? 'account-display-name-error' : undefined}
            />

            {nicknameError ? (
              <p id="account-display-name-error" className="text-xs text-red-600">
                {nicknameError}
              </p>
            ) : (
              <p className="text-xs leading-5 text-muted-foreground">
                Optional. Staff workspace will show this instead of your full name.
              </p>
            )}
          </div>
        </div>

        <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
          <div aria-live="polite">
            {message ? (
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="size-4" />
                {message}
              </p>
            ) : null}
          </div>

          {hasChanges ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer gap-2"
                disabled={isSaving}
                onClick={resetToSaved}
              >
                <X className="size-4" />
                Cancel
              </Button>

              <Button
                type="submit"
                className="cursor-pointer gap-2"
                disabled={isSaving || Boolean(nameError || nicknameError)}
              >
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save changes
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </form>
  )
}