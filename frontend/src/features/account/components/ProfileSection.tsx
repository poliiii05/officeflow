import { IdCard, Loader2, LockKeyhole, Save, ShieldCheck, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateAccountProfile } from '@/features/account/account-api'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import { saveStoredUser, type AuthUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

const roleLabels: Record<AuthUser['role'], string> = {
  user: 'User',
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
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ProfileSection({
  user,
  onUserUpdated,
  allowRequesterType = false,
}: {
  user: AuthUser
  onUserUpdated: (user: AuthUser) => void
  allowRequesterType?: boolean
}) {
  const [name, setName] = useState(user.name)
  const [savedName, setSavedName] = useState(user.name)
  const [requesterType, setRequesterType] = useState<'employee' | 'visitor'>(
    user.requester_type ?? 'visitor'
  )
  const [savedRequesterType, setSavedRequesterType] = useState<'employee' | 'visitor'>(
    user.requester_type ?? 'visitor'
  )
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const canEditRequesterType = allowRequesterType && user.role === 'user'

  const hasChanges =
    name.trim() !== savedName ||
    (canEditRequesterType && requesterType !== savedRequesterType)

  useEffect(() => {
    setName(user.name)
    setSavedName(user.name)
    setRequesterType(user.requester_type ?? 'visitor')
    setSavedRequesterType(user.requester_type ?? 'visitor')
  }, [user])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!hasChanges) return

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await updateAccountProfile({
        name: name.trim(),
        requester_type: canEditRequesterType ? requesterType : undefined,
      })

      const nextRequesterType = response.data.requester_type ?? 'visitor'

      setSavedName(response.data.name)
      setRequesterType(nextRequesterType)
      setSavedRequesterType(nextRequesterType)
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
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="border-b bg-slate-50 px-5 py-4">
        <h2 className="font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your visible account name and workspace identity.
        </p>
      </div>

      <div className="space-y-5 p-5">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex items-center gap-4">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="size-16 rounded-full border object-cover" />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full border bg-slate-50 text-lg font-semibold">
              {getInitials(user.name)}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <InfoBox icon={ShieldCheck} label="Role">
            <Badge className={cn('border-0', roleStyles[user.role])}>{roleLabels[user.role]}</Badge>
          </InfoBox>

          <InfoBox icon={IdCard} label="Account type">
            <span className="font-medium capitalize">
              {user.role === 'user' ? user.requester_type : 'Internal workspace'}
            </span>
          </InfoBox>

          <InfoBox icon={LockKeyhole} label="Access">
            <span className="font-medium">
              {user.role === 'super_admin'
                ? 'Full access'
                : user.role === 'staff'
                  ? 'Staff tools'
                  : 'Requester portal'}
            </span>
          </InfoBox>
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-name">Full name</Label>
          <Input id="account-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>

        {canEditRequesterType ? (
          <div>
            <Label>Requester type</Label>
            <div className="mt-2 grid max-w-md grid-cols-2 gap-2">
              {(['employee', 'visitor'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRequesterType(type)}
                  className={cn(
                    'h-9 cursor-pointer rounded-lg border text-sm font-medium transition-colors',
                    requesterType === type
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'bg-white text-muted-foreground hover:bg-muted'
                  )}
                >
                  {type === 'employee' ? 'Employee' : 'Visitor'}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex min-h-9 items-center justify-between gap-3">
          <p className="text-sm font-medium text-emerald-700">{message}</p>

          {hasChanges ? (
            <Button type="submit" className="cursor-pointer gap-2" disabled={isSaving}>
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save profile
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  )
}

function InfoBox({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  )
}