import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Save, ShieldCheck } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateAccountPassword } from '@/features/account/account-api'
import { getApiErrorMessage } from '@/features/auth/auth-api'
import type { AuthUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

export function PasswordSection({ user }: { user: AuthUser }) {
  const isGoogleAccount = Boolean(user.google_id)

  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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

  const hasPasswordInput = Boolean(currentPassword || password || passwordConfirmation)
  const shouldShowRules = Boolean(password || passwordConfirmation)
  const canUpdatePassword =
    currentPassword.length > 0 && passwordChecks.every((check) => check.valid)

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
      setMessage(response.message)
    } catch (passwordError) {
      setError(getApiErrorMessage(passwordError, 'Unable to update password.'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isGoogleAccount) {
    return (
      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="border-b bg-slate-50 px-5 py-4">
          <h2 className="font-semibold">Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Google controls password security for this account.
          </p>
        </div>

        <div className="p-5">
          <div className="rounded-lg border bg-violet-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <ShieldCheck className="size-5" />
              </div>

              <div>
                <p className="font-medium">Google sign-in connected</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Password changes are managed from the connected Google account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="border-b bg-slate-50 px-5 py-4">
        <h2 className="font-semibold">Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">Modify your current password.</p>
      </div>

      <div className="space-y-5 p-5">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
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

        {shouldShowRules ? (
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

        <div className="flex min-h-9 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {hasPasswordInput ? (
            <button
              type="button"
              className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground"
              onClick={() => setShowPasswords((value) => !value)}
            >
              {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {showPasswords ? 'Hide passwords' : 'Show passwords'}
            </button>
          ) : (
            <span />
          )}

          {hasPasswordInput ? (
            <Button
              type="submit"
              className="cursor-pointer gap-2"
              disabled={isSaving || !canUpdatePassword}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Update password
            </Button>
          ) : null}
        </div>

        {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      </div>
    </form>
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
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  )
}