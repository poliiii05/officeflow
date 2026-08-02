import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { getApiErrorMessage, loginUser } from '@/features/auth/auth-api'

type LoginErrors = {
  email?: string
  password?: string
  form?: string
}

function isValidEmail(email: string) {
  const value = email.trim().toLowerCase()
  const parts = value.split('@')

  if (parts.length !== 2) return false

  const [local, domain] = parts

  if (!local || !domain) return false
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false

  const labels = domain.split('.')

  if (labels.length < 2) return false
  if (labels.some((label) => !label || label.startsWith('-') || label.endsWith('-'))) return false
  if (!labels.every((label) => /^[a-z0-9-]+$/i.test(label))) return false
  if (!/^[a-z]{2,}$/i.test(labels[labels.length - 1])) return false

  return true
}

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  function validateForm() {
    const nextErrors: LoginErrors = {}

    if (!form.email.trim()) {
      nextErrors.email = 'Email address is required.'
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      await loginUser(
        {
          email: form.email.trim(),
          password: form.password,
        },
        remember
      )

      navigate('/dashboard')
    } catch (error) {
      setErrors({
        form: getApiErrorMessage(error, 'Unable to login. Please try again.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Login to OfficeFlow</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Access your tickets, appointment requests, and workspace.
        </p>
      </div>

      {errors.form ? (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.form}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              className="pl-9"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              aria-invalid={Boolean(errors.email)}
            />
          </div>
          {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="px-9"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              aria-invalid={Boolean(errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            className="cursor-pointer"
            checked={remember}
            onCheckedChange={(checked) => setRemember(Boolean(checked))}
          />
          <Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-muted-foreground">
            Keep me signed in on this device
          </Label>
        </div>

        <Button className="w-full cursor-pointer" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <Button
        className="w-full cursor-pointer"
        variant="outline"
        type="button"
        onClick={() => {
          window.location.replace(`${import.meta.env.VITE_API_URL}/auth/google/redirect`)
        }}
      >
        <Mail className="size-4" />
        Continue with Google
      </Button>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        No account yet?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}