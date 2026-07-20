import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'

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

export function RegisterPage() {
  const [requesterType, setRequesterType] =
    useState<(typeof requesterTypes)[number]['value']>('employee')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-sm font-medium text-muted-foreground">Create account</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Start using OfficeFlow</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Submit service requests, book appointments, and track office updates.
        </p>
      </div>

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

      <form className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" type="text" placeholder="Juan" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" type="text" placeholder="Dela Cruz" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" placeholder="name@example.com" />
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
        </div>

        <div className="flex items-start gap-2">
          <Checkbox id="terms" className="mt-0.5" />
          <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
            I agree to the{' '}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>

        <Button className="w-full cursor-pointer" type="button">
          Create account
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <Button className="w-full cursor-pointer" variant="outline" type="button">
        <Mail className="size-4" />
        Continue with Google
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