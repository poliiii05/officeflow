import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail } from 'lucide-react'

import { getApiErrorMessage, registerUser } from '@/features/auth/auth-api'
import { PrivacyDialog } from '@/features/legal/components/PrivacyDialog'
import { TermsDialog } from '@/features/legal/components/TermsDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const requesterTypes = [
  { value: 'employee', label: 'Employee' },
  { value: 'visitor', label: 'Visitor' },
] as const

type RequesterType = (typeof requesterTypes)[number]['value']

type RegisterErrors = {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  passwordConfirmation?: string
  terms?: string
  form?: string
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePassword(password: string) {
  return {
    hasMinLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  }
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [requesterType, setRequesterType] = useState<RequesterType>('employee')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })

  const passwordChecks = useMemo(() => validatePassword(form.password), [form.password])
  const showPasswordRules = form.password.length > 0
  const showPasswordMatch =
    form.passwordConfirmation.length > 0 && form.password.length > 0
  const passwordsMatch = form.password === form.passwordConfirmation

  function validateForm() {
    const nextErrors: RegisterErrors = {}

    if (!form.firstName.trim()) {
      nextErrors.firstName = 'First name is required.'
    }

    if (!form.lastName.trim()) {
      nextErrors.lastName = 'Last name is required.'
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email address is required.'
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.'
    } else if (!passwordChecks.hasMinLength || !passwordChecks.hasNumber || !passwordChecks.hasSymbol) {
      nextErrors.password = 'Password must meet all requirements.'
    }

    if (!form.passwordConfirmation) {
      nextErrors.passwordConfirmation = 'Confirm your password.'
    } else if (!passwordsMatch) {
      nextErrors.passwordConfirmation = 'Passwords do not match.'
    }

    if (!acceptTerms) {
      nextErrors.terms = 'You need to accept the terms and privacy policy.'
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
      await registerUser({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        password: form.password,
        password_confirmation: form.passwordConfirmation,
        requester_type: requesterType,
      })

      navigate('/dashboard')
    } catch (error) {
      setErrors({
        form: getApiErrorMessage(error, 'Unable to create account. Please try again.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-medium text-muted-foreground">Create account</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Start using OfficeFlow</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Submit service requests, book appointments, and track office updates.
        </p>
      </div>

      {errors.form ? (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.form}
        </div>
      ) : null}

      <div className="mb-4">
        <p className="mb-2 text-sm font-medium">Requester type</p>
        <div className="grid grid-cols-2 gap-2">
          {requesterTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setRequesterType(type.value)}
              className={cn(
                'cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                requesterType === type.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input text-muted-foreground hover:bg-muted'
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Juan"
              value={form.firstName}
              onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
              aria-invalid={Boolean(errors.firstName)}
            />
            {errors.firstName ? <p className="text-xs text-destructive">{errors.firstName}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Dela Cruz"
              value={form.lastName}
              onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
              aria-invalid={Boolean(errors.lastName)}
            />
            {errors.lastName ? <p className="text-xs text-destructive">{errors.lastName}</p> : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
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

          {showPasswordRules ? (
            <div className="grid gap-1 text-xs">
              <PasswordRule passed={passwordChecks.hasMinLength} label="At least 8 characters" />
              <PasswordRule passed={passwordChecks.hasNumber} label="Includes 1 number" />
              <PasswordRule passed={passwordChecks.hasSymbol} label="Includes 1 special character" />
            </div>
          ) : null}

          {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordConfirmation">Confirm password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="passwordConfirmation"
              type={showPasswordConfirmation ? 'text' : 'password'}
              placeholder="Confirm your password"
              className="px-9"
              value={form.passwordConfirmation}
              onChange={(event) =>
                setForm((current) => ({ ...current, passwordConfirmation: event.target.value }))
              }
              aria-invalid={Boolean(errors.passwordConfirmation)}
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirmation((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label={showPasswordConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}
            >
              {showPasswordConfirmation ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {showPasswordMatch ? (
            <PasswordRule passed={passwordsMatch} label={passwordsMatch ? 'Passwords match' : 'Passwords do not match'} />
          ) : null}

          {errors.passwordConfirmation ? (
            <p className="text-xs text-destructive">{errors.passwordConfirmation}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              className="mt-0.5"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(Boolean(checked))}
            />
            <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
              I agree to the <TermsDialog /> and <PrivacyDialog />
            </Label>
          </div>
          {errors.terms ? <p className="text-xs text-destructive">{errors.terms}</p> : null}
        </div>

        <Button className="w-full cursor-pointer" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <Button className="w-full cursor-pointer" variant="outline" type="button" disabled>
        <Mail className="size-4" />
        Continue with Google soon
      </Button>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  )
}

function PasswordRule({ passed, label }: { passed: boolean; label: string }) {
  return (
    <p className={cn('flex items-center gap-1.5 text-xs', passed ? 'text-emerald-600' : 'text-destructive')}>
      <CheckCircle2 className="size-3.5" />
      {label}
    </p>
  )
}