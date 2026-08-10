import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateAccountPassword } from '@/features/account/account-api'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import type { AuthUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

// Previously a single `visibleField: PasswordField | null` shared across all
// three inputs meant showing one field auto-hid whichever was showing
// before it — you could never see "New password" and "Confirm password" at
// the same time to check they matched. Independent booleans per field fix
// that.
type VisibleFields = {
  current: boolean
  new: boolean
  confirmation: boolean
}

export function PasswordSection({
  user,
  className,
}: {
  user: AuthUser
  className?: string
}) {
  const isGoogleAccount = Boolean(user.google_id)
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [visibleFields, setVisibleFields] = useState<VisibleFields>({
    current: false,
    new: false,
    confirmation: false,
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function toggleVisible(field: keyof VisibleFields) {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }))
  }

  const passwordRequirements = useMemo(
    () => [
      { label: 'At least 8 characters', valid: password.length >= 8 },
      { label: 'Includes 1 number', valid: /\d/.test(password) },
      { label: 'Includes 1 special character', valid: /[^A-Za-z0-9]/.test(password) },
      {
        label: 'Different from current password',
        valid: password.length > 0 && password !== currentPassword,
      },
    ],
    [currentPassword, password]
  )

  const missingRequirements = passwordRequirements.filter((requirement) => !requirement.valid)
  const passwordMismatch =
    passwordConfirmation.length > 0 && password !== passwordConfirmation
  const hasPasswordInput = Boolean(currentPassword || password || passwordConfirmation)
  const canUpdatePassword =
    currentPassword.length > 0 &&
    passwordConfirmation.length > 0 &&
    !passwordMismatch &&
    missingRequirements.length === 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canUpdatePassword) return

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await updateAccountPassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      })

      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
      setVisibleFields({ current: false, new: false, confirmation: false })
      setMessage(response.message)
    } catch (passwordError) {
      setError(getApiErrorMessage(passwordError, 'Unable to update password.'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isGoogleAccount) {
    return (
      <section className={cn('overflow-hidden rounded-lg border bg-white shadow-sm', className)}>
        <div className="border-b bg-slate-50 px-5 py-4">
          <h2 className="font-semibold">Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">Google manages this account's password.</p>
        </div>

        <div className="flex items-start gap-3 p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="font-medium">Password managed by Google</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Update your password and recovery options from the connected Google account.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('overflow-hidden rounded-lg border bg-white shadow-sm', className)}
    >
      <div className="border-b bg-slate-50 px-5 py-4">
        <h2 className="font-semibold">Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use your current password to set a new one.
        </p>
      </div>

      <div className="space-y-5 p-5">
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <PasswordInput
            id="current-password"
            label="Current password"
            value={currentPassword}
            onChange={(value) => {
              setCurrentPassword(value)
              setMessage('')
              setError('')
            }}
            visible={visibleFields.current}
            onToggle={() => toggleVisible('current')}
            autoComplete="current-password"
          />
          <PasswordInput
            id="new-password"
            label="New password"
            value={password}
            onChange={(value) => {
              setPassword(value)
              setMessage('')
              setError('')
            }}
            visible={visibleFields.new}
            onToggle={() => toggleVisible('new')}
            autoComplete="new-password"
          />
          <PasswordInput
            id="confirm-password"
            label="Confirm password"
            value={passwordConfirmation}
            onChange={(value) => {
              setPasswordConfirmation(value)
              setMessage('')
              setError('')
            }}
            visible={visibleFields.confirmation}
            onToggle={() => toggleVisible('confirmation')}
            autoComplete="new-password"
          />
        </div>

        {password && missingRequirements.length ? (
          <div className="grid gap-2 rounded-lg border bg-slate-50 p-4 sm:grid-cols-2">
            {missingRequirements.map((requirement) => (
              <p key={requirement.label} className="flex items-center gap-2 text-sm text-red-600">
                <KeyRound className="size-4" />
                {requirement.label}
              </p>
            ))}
          </div>
        ) : null}

        {passwordMismatch ? (
          <p className="text-sm text-red-600">Password did not match.</p>
        ) : null}

        <div className="flex min-h-9 items-center justify-between gap-3">
          {message ? (
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="size-4" />
              {message}
            </p>
          ) : (
            <span />
          )}

          {hasPasswordInput ? (
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isSaving || !canUpdatePassword}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              Update password
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  )
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggle: () => void
  autoComplete: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="px-9"
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  )
}