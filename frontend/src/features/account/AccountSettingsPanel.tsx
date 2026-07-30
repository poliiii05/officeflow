import {
  CheckCircle2,
  Eye,
  EyeOff,
  IdCard,
  LockKeyhole,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getAccount,
  updateAccountPassword,
  updateAccountProfile,
} from '@/features/account/account-api'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import { getStoredUser, saveStoredUser, type AuthUser } from '@/lib/auth-storage'
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

export function AccountSettingsPanel() {
  const storedUser = getStoredUser()

  const [user, setUser] = useState<AuthUser | null>(storedUser)
  const [name, setName] = useState(storedUser?.name ?? '')
  const [savedName, setSavedName] = useState(storedUser?.name ?? '')
  const [requesterType, setRequesterType] = useState<'employee' | 'visitor'>(
    storedUser?.requester_type ?? 'visitor'
  )
  const [savedRequesterType, setSavedRequesterType] = useState<'employee' | 'visitor'>(
    storedUser?.requester_type ?? 'visitor'
  )

  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)

  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [error, setError] = useState('')
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)

  const isGoogleAccount = Boolean(user?.google_id)
  const isEmailVerified = Boolean(user?.email_verified_at || user?.google_id)

  const hasProfileChanges =
    name.trim() !== savedName || (user?.role === 'user' && requesterType !== savedRequesterType)

  const hasPasswordInput = Boolean(currentPassword || password || passwordConfirmation)
  const shouldShowPasswordRules = Boolean(password || passwordConfirmation)

  const passwordChecks = useMemo(
    () => [
      { label: 'At least 8 characters', valid: password.length >= 8 },
      { label: 'Has at least 1 number', valid: /\d/.test(password) },
      { label: 'Has at least 1 symbol', valid: /[^A-Za-z0-9]/.test(password) },
      {
        label: 'Passwords match',
        valid: password.length > 0 && password === passwordConfirmation,
      },
    ],
    [password, passwordConfirmation]
  )

  const canUpdatePassword =
    currentPassword.length > 0 && passwordChecks.every((check) => check.valid)

  useEffect(() => {
    async function loadAccount() {
      try {
        const account = await getAccount()
        const nextRequesterType = account.requester_type ?? 'visitor'

        setUser(account)
        setName(account.name)
        setSavedName(account.name)
        setRequesterType(nextRequesterType)
        setSavedRequesterType(nextRequesterType)
        saveStoredUser(account)
      } catch {
        setError('Unable to load your account details.')
      }
    }

    void loadAccount()
  }, [])

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !hasProfileChanges) return

    setIsProfileSaving(true)
    setError('')
    setProfileMessage('')

    try {
      const response = await updateAccountProfile({
        name: name.trim(),
        requester_type: user.role === 'user' ? requesterType : undefined,
      })

      const nextRequesterType = response.data.requester_type ?? 'visitor'

      setUser(response.data)
      setSavedName(response.data.name)
      setRequesterType(nextRequesterType)
      setSavedRequesterType(nextRequesterType)
      saveStoredUser(response.data)
      setProfileMessage(response.message)
    } catch (profileError) {
      setError(getApiErrorMessage(profileError, 'Unable to update profile.'))
    } finally {
      setIsProfileSaving(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canUpdatePassword) return

    setIsPasswordSaving(true)
    setError('')
    setPasswordMessage('')

    try {
      const response = await updateAccountPassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      })

      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
      setPasswordMessage(response.message)
    } catch (passwordError) {
      setError(getApiErrorMessage(passwordError, 'Unable to update password.'))
    } finally {
      setIsPasswordSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
        Loading account...
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-6xl overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="border-b bg-white px-6 py-5">
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile information and login security.
        </p>
      </div>

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="divide-y">
        <form onSubmit={handleProfileSubmit} className="space-y-6 px-6 py-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="size-20 rounded-full border object-cover"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full border bg-slate-50 text-xl font-semibold">
                {getInitials(user.name)}
              </div>
            )}

            <div className="min-w-0">
              <p className="font-semibold">Profile identity</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isGoogleAccount
                  ? 'This account uses Google sign-in.'
                  : 'This account uses manual email and password sign-in.'}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge
                  className={cn(
                    'border-0',
                    isGoogleAccount
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-slate-100 text-slate-700'
                  )}
                >
                  {isGoogleAccount ? 'Google account' : 'Password account'}
                </Badge>

                <Badge
                  className={cn(
                    'border-0',
                    isEmailVerified
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {isEmailVerified ? 'Verified' : 'Not verified yet'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Gmail account</Label>
              <EmailRow email={user.email} verified={isEmailVerified} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <InfoBox icon={ShieldCheck} label="System role">
              <Badge className={cn('border-0', roleStyles[user.role])}>
                {roleLabels[user.role]}
              </Badge>
            </InfoBox>

            <InfoBox icon={IdCard} label="Account type">
              <span className="font-medium capitalize">
                {user.role === 'user' ? user.requester_type : 'Internal workspace'}
              </span>
            </InfoBox>

            <InfoBox icon={LockKeyhole} label="Access level">
              <span className="font-medium">
                {user.role === 'super_admin'
                  ? 'Full access'
                  : user.role === 'staff'
                    ? 'Staff tools'
                    : 'Requester portal'}
              </span>
            </InfoBox>
          </div>

          {user.role === 'user' ? (
            <div>
              <Label>Requester type</Label>
              <div className="mt-2 grid max-w-md grid-cols-2 gap-2">
                {(['employee', 'visitor'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRequesterType(type)}
                    className={cn(
                      'h-10 cursor-pointer rounded-lg border text-sm font-medium transition-colors',
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
            {profileMessage ? (
              <p className="text-sm font-medium text-emerald-700">{profileMessage}</p>
            ) : (
              <span />
            )}

            {hasProfileChanges ? (
              <Button type="submit" className="cursor-pointer" disabled={isProfileSaving}>
                {isProfileSaving ? 'Saving...' : 'Save profile'}
              </Button>
            ) : null}
          </div>
        </form>

        {isGoogleAccount ? (
          <div className="space-y-4 px-6 py-6">
            <div>
              <h3 className="font-semibold">Login security</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your login is protected through your connected Google account.
              </p>
            </div>

            <div className="rounded-lg border bg-slate-50 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Google sign-in connected</p>
                  <p className="text-sm text-muted-foreground">
                    Password changes are managed through your Google account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-5 px-6 py-6">
            <div>
              <h3 className="font-semibold">Password</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Modify your current password.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <PasswordInput
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                show={showPasswords}
              />
              <PasswordInput
                label="New password"
                value={password}
                onChange={setPassword}
                show={showPasswords}
              />
              <PasswordInput
                label="Confirm password"
                value={passwordConfirmation}
                onChange={setPasswordConfirmation}
                show={showPasswords}
              />
            </div>

            {shouldShowPasswordRules ? (
              <div className="grid gap-2 rounded-lg border bg-slate-50 p-4 sm:grid-cols-2">
                {passwordChecks.map((check) => (
                  <p
                    key={check.label}
                    className={cn(
                      'flex items-center gap-2 text-sm',
                      check.valid ? 'text-emerald-700' : 'text-red-600'
                    )}
                  >
                    <CheckCircle2 className="size-4" />
                    {check.label}
                  </p>
                ))}
              </div>
            ) : null}

            {hasPasswordInput ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                  onClick={() => setShowPasswords((value) => !value)}
                >
                  {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  {showPasswords ? 'Hide passwords' : 'Show passwords'}
                </button>

                <Button
                  type="submit"
                  className="cursor-pointer"
                  disabled={isPasswordSaving || !canUpdatePassword}
                >
                  {isPasswordSaving ? 'Updating...' : 'Update password'}
                </Button>
              </div>
            ) : null}

            {passwordMessage ? (
              <p className="text-sm font-medium text-emerald-700">{passwordMessage}</p>
            ) : null}
          </form>
        )}
      </div>
    </section>
  )
}

function EmailRow({ email, verified }: { email: string; verified: boolean }) {
  return (
    <div className="flex min-h-10 flex-col gap-3 rounded-lg border bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" />
          <p className="break-all font-medium">{email}</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Primary email</p>
      </div>

      <Badge
        className={cn(
          'w-fit border-0',
          verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        )}
      >
        {verified ? 'Verified' : 'Not verified yet'}
      </Badge>
    </div>
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
    <div className="rounded-lg border bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}