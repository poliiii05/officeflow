import {
  Bell,
  CalendarCheck,
  Check,
  LayoutDashboard,
  TicketCheck,
} from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { completeOnboarding, getApiErrorMessage } from '@/features/auth/auth-api'
import { saveStoredUser, type AuthUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

type RequesterOnboardingDialogProps = {
  user: AuthUser
  open: boolean
  onCompleted: (user: AuthUser) => void
}

const steps = [
  {
    title: 'Welcome to your workspace',
    description: 'Your dashboard summarizes active requests, appointments, and recent office updates.',
    icon: LayoutDashboard,
    accent: 'bg-sky-50 text-sky-700',
  },
  {
    title: 'Submit and track requests',
    description: 'Create a service request or appointment, then follow every status change from your workspace.',
    icon: TicketCheck,
    secondaryIcon: CalendarCheck,
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    title: 'Stay updated',
    description: 'Notifications take you back to the request where staff replies and schedule updates appear.',
    icon: Bell,
    accent: 'bg-violet-50 text-violet-700',
  },
] as const

export function RequesterOnboardingDialog({
  user,
  open,
  onCompleted,
}: RequesterOnboardingDialogProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const step = steps[stepIndex]
  const Icon = step.icon
  const SecondaryIcon = 'secondaryIcon' in step ? step.secondaryIcon : null
  const isLastStep = stepIndex === steps.length - 1

  async function finishOnboarding() {
    if (isSaving) return

    setIsSaving(true)
    setError('')

    try {
      const updatedUser = await completeOnboarding()
      saveStoredUser(updatedUser)
      onCompleted(updatedUser)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to save your onboarding progress.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) void finishOnboarding()
      }}
    >
      <DialogContent className="!max-w-lg overflow-hidden rounded-xl p-0">
        <div className="w-full border-b bg-slate-50 px-6 py-5">
          <DialogHeader>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Getting started</p>
                <DialogTitle className="mt-1 text-xl">Welcome to OfficeFlow, {user.name}</DialogTitle>
              </div>
            </div>
            <DialogDescription>
              A quick guide to your requester workspace. You can skip it at any time.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="w-full px-6 py-5">
          <div className="mb-5 grid grid-cols-3 gap-2" aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>
            {steps.map((item, index) => (
              <span
                key={item.title}
                className={cn(
                  'h-1.5 rounded-full transition-colors',
                  index <= stepIndex ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>

          <div className="flex min-h-44 flex-col justify-center rounded-lg border bg-background p-5">
            <div className={cn('flex size-12 items-center justify-center rounded-lg', step.accent)}>
              {SecondaryIcon ? (
                <div className="flex items-center gap-0.5">
                  <Icon className="size-5" />
                  <SecondaryIcon className="size-4" />
                </div>
              ) : (
                <Icon className="size-5" />
              )}
            </div>
            <p className="mt-4 text-lg font-semibold">{step.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              disabled={isSaving}
              onClick={() => void finishOnboarding()}
            >
              Skip tour
            </Button>

            <div className="flex items-center gap-2">
              {stepIndex > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  disabled={isSaving}
                  onClick={() => setStepIndex((current) => current - 1)}
                >
                  Back
                </Button>
              ) : null}

              <Button
                type="button"
                className="min-w-24 cursor-pointer"
                disabled={isSaving}
                onClick={() => {
                  if (isLastStep) {
                    void finishOnboarding()
                    return
                  }

                  setStepIndex((current) => current + 1)
                }}
              >
                {isSaving ? 'Saving...' : isLastStep ? 'Finish' : 'Next'}
                {isLastStep && !isSaving ? <Check className="size-4" /> : null}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
