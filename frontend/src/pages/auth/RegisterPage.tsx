import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CircleAlert,
  ClipboardList,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { getApiErrorMessage, registerUser } from '@/features/auth/auth-api'
import { PrivacyDialog } from '@/features/legal/components/PrivacyDialog'
import { TermsDialog } from '@/features/legal/components/TermsDialog'

type RegisterErrors = {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  passwordConfirmation?: string
  terms?: string
  form?: string
}

const commonEmailTypos: Record<string, string> = {
  'gmal.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'glaim.com': 'gmail.com',
  'glim.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahho.com': 'yahoo.com',
  'outlok.com': 'outlook.com',
  'hotmial.com': 'hotmail.com',
  'icloud.co': 'icloud.com',
}

const passwordRequirements = [
  {
    label: 'At least 8 characters',
    isValid: (password: string) => password.length >= 8,
  },
  {
    label: 'Includes 1 number',
    isValid: (password: string) => /\d/.test(password),
  },
  {
    label: 'Includes 1 special character',
    isValid: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function getEmailRequirement(email: string) {
  const value = email.trim().toLowerCase()

  if (!value) return ''
  if (!value.includes('@')) return 'Email must include @.'
  if (value.startsWith('@')) return 'Add the email name before @.'

  const [localPart, domainPart] = value.split('@')

  if (!localPart) return 'Add the email name before @.'
  if (!domainPart) return 'Add the email domain after @.'
  if (value.split('@').length > 2) return 'Email can only include one @.'
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return 'Email name cannot start or end with a period.'
  }
  if (localPart.includes('..')) return 'Email name cannot include double periods.'
  if (!domainPart.includes('.')) return 'Email domain must include a valid ending like .com or .edu.ph.'

  const labels = domainPart.split('.')
  const topLevelDomain = labels.at(-1) ?? ''

  if (labels.some((label) => !label)) return 'Email domain has an invalid period placement.'
  if (labels.some((label) => label.startsWith('-') || label.endsWith('-'))) {
    return 'Email domain cannot start or end with a hyphen.'
  }
  if (labels.some((label) => /^\d+$/.test(label))) {
    return 'Email domain cannot be only numbers.'
  }
  if (!/^[a-z]{2,}$/i.test(topLevelDomain)) {
    return 'Email ending must use letters, like .com, .org, or .edu.ph.'
  }

  const suggestion = commonEmailTypos[domainPart]
  if (suggestion) return `Did you mean ${localPart}@${suggestion}?`

  if (!emailPattern.test(value)) return 'Use a valid email address.'

  return ''
}

export function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const googleAuthUrl = `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/auth/google/redirect`
  const missingPasswordRequirements = useMemo(
    () => passwordRequirements.filter((rule) => !rule.isValid(form.password)),
    [form.password],
  )

  const emailRequirement = useMemo(() => getEmailRequirement(form.email), [form.email])

  const passwordMismatch =
    form.passwordConfirmation.length > 0 && form.password !== form.passwordConfirmation

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setErrors((current) => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }))
  }

  function validateForm() {
    const nextErrors: RegisterErrors = {}

    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required.'
    if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required.'
    if (!form.email.trim()) nextErrors.email = 'Email address is required.'
    else if (emailRequirement) nextErrors.email = emailRequirement

    if (!form.password) nextErrors.password = 'Password is required.'
    else if (missingPasswordRequirements.length > 0) {
      nextErrors.password = missingPasswordRequirements[0].label
    }

    if (!form.passwordConfirmation) {
      nextErrors.passwordConfirmation = 'Confirm your password.'
    } else if (passwordMismatch) {
      nextErrors.passwordConfirmation = 'Password did not match.'
    }

    if (!acceptTerms) nextErrors.terms = 'Please agree to the Terms and Privacy Policy.'

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
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        password_confirmation: form.passwordConfirmation,
        terms_accepted: acceptTerms,
      })

      setSuccessDialogOpen(true)
    } catch (error) {
      setErrors({
        form: getApiErrorMessage(error, 'Unable to create account. Please try again.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <p className="text-sm font-medium text-muted-foreground">Create account</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Start using OfficeFlow</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Submit service requests, book appointments, and track office updates.
          </p>
        </div>

        {errors.form ? (
          <div className="mb-4 flex gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{errors.form}</p>
          </div>
        ) : null}

        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Juan"
                value={form.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
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
                onChange={(event) => updateField('lastName', event.target.value)}
              />
              {errors.lastName ? <p className="text-xs text-destructive">{errors.lastName}</p> : null}
            </div>
          </div>

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
                onChange={(event) => updateField('email', event.target.value)}
              />
            </div>
            {form.email && emailRequirement ? (
              <p className="text-xs text-destructive">{emailRequirement}</p>
            ) : null}
            {errors.email && !emailRequirement ? (
              <p className="text-xs text-destructive">{errors.email}</p>
            ) : null}
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
                onChange={(event) => updateField('password', event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 cursor-pointer -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {form.password && missingPasswordRequirements.length ? (
              <div className="space-y-1">
                {missingPasswordRequirements.map((rule) => (
                  <p key={rule.label} className="text-xs text-destructive">
                    {rule.label}
                  </p>
                ))}
              </div>
            ) : null}
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
                onChange={(event) => updateField('passwordConfirmation', event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirmation((value) => !value)}
                className="absolute right-3 top-1/2 cursor-pointer -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPasswordConfirmation ? 'Hide password' : 'Show password'}
              >
                {showPasswordConfirmation ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {passwordMismatch ? <p className="text-xs text-destructive">Password did not match.</p> : null}
            {errors.passwordConfirmation && !passwordMismatch ? (
              <p className="text-xs text-destructive">{errors.passwordConfirmation}</p>
            ) : null}
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => {
                setAcceptTerms(checked === true)
                setErrors((current) => ({ ...current, terms: undefined, form: undefined }))
              }}
              className="mt-0.5 cursor-pointer"
            />
            <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
              I agree to the <TermsDialog /> and <PrivacyDialog />.
            </Label>
          </div>

          {errors.terms ? <p className="text-xs text-destructive">{errors.terms}</p> : null}

          <Button
            className="w-full cursor-pointer"
            type="submit"
            disabled={isSubmitting || successDialogOpen || !acceptTerms}
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <a
            href={googleAuthUrl}
            className={buttonVariants({
              variant: 'outline',
              className: 'w-full cursor-pointer',
            })}
          >
            <Mail className="size-4" />
            Continue with Google
          </a>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="overflow-hidden rounded-2xl p-0 text-center shadow-2xl ring-0 sm:max-w-sm"
        >
          <div className="flex w-full items-center gap-3 border-b px-7 py-5 text-left">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="text-base font-semibold leading-tight">OfficeFlow</p>
              <p className="text-sm text-muted-foreground">Appointment & Ticketing</p>
            </div>
          </div>

          <div className="w-full px-7 pt-5 pb-9 text-center">
            <DialogHeader className="w-full items-center gap-3 text-center">
              <DialogTitle className="w-full text-center text-2xl font-semibold tracking-tight">
                Account created successfully
              </DialogTitle>
              <DialogDescription className="w-full text-center text-sm leading-6 text-muted-foreground">
                Please check your email for verification.
              </DialogDescription>
            </DialogHeader>

            <Button
              className="mt-7 w-full cursor-pointer"
              onClick={() => navigate('/login?registered=1', { replace: true })}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}