import {
  BellRing,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  TicketCheck,
  TicketPlus,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import {
  completeOnboarding,
  getApiErrorMessage,
} from '@/features/auth/auth-api'
import { saveStoredUser, type AuthUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

type RequesterOnboardingDialogProps = {
  user: AuthUser
  open: boolean
  onCompleted: (user: AuthUser) => void
}

type TargetRect = {
  top: number
  right: number
  bottom: number
  left: number
  width: number
  height: number
}

type TourStep = {
  target: string
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  accent: string
}

const steps: TourStep[] = [
  {
    target: '[data-tour="dashboard-summary"]',
    eyebrow: 'Your workspace',
    title: 'See your requests at a glance',
    description:
      'These cards summarize your active service requests, upcoming appointments, and completed work.',
    icon: LayoutDashboard,
    accent: 'bg-sky-50 text-sky-700',
  },
  {
    target: '[data-tour="new-request"]',
    eyebrow: 'Service requests',
    title: 'Submit a new request',
    description:
      'Use this when you need help from an office team or want to request a document or service.',
    icon: TicketPlus,
    accent: 'bg-sky-50 text-sky-700',
  },
  {
    target: '[data-tour="recent-requests"]',
    eyebrow: 'My Requests',
    title: 'Follow every request',
    description:
      'Open a request to review its status, submitted details, and replies from the office team.',
    icon: TicketCheck,
    accent: 'bg-violet-50 text-violet-700',
  },
  {
    target: '[data-tour="book-appointment"]',
    eyebrow: 'Appointments',
    title: 'Request an office visit',
    description:
      'Choose an office service and preferred schedule. Staff can confirm or adjust the appointment.',
    icon: CalendarPlus,
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    target: '[data-tour="latest-updates"]',
    eyebrow: 'Updates',
    title: 'Stay informed',
    description:
      'Staff replies and status changes appear here so you can quickly return to the affected request.',
    icon: BellRing,
    accent: 'bg-amber-50 text-amber-700',
  },
  {
    target: 'a[href="/settings"]',
    eyebrow: 'Settings',
    title: 'Manage your account',
    description:
      'Update your profile and sign-in security from the Settings module whenever you need to.',
    icon: Settings,
    accent: 'bg-slate-100 text-slate-700',
  },
]

const workspaceModules = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'My Requests', icon: TicketCheck },
  { label: 'Appointments', icon: CalendarPlus },
  { label: 'Notifications', icon: BellRing },
  { label: 'Settings', icon: Settings },
]

const SPOTLIGHT_PADDING = 8
const TOOLTIP_WIDTH = 360
const TOOLTIP_HEIGHT_ESTIMATE = 270
const VIEWPORT_GAP = 16

export function RequesterOnboardingDialog({
  user,
  open,
  onCompleted,
}: RequesterOnboardingDialogProps) {
  const [hasStartedTour, setHasStartedTour] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const step = steps[stepIndex]
  const Icon = step.icon
  const isLastStep = stepIndex === steps.length - 1

  useEffect(() => {
    if (!open || !hasStartedTour) {
      setTargetRect(null)
      return
    }

    let frameId = 0
    let settleTimer = 0
    let resizeObserver: ResizeObserver | null = null

    const target = document.querySelector<HTMLElement>(step.target)

    function measureTarget() {
      if (!target) {
        setTargetRect(null)
        return
      }

      const rect = target.getBoundingClientRect()
      setTargetRect({
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    }

    function scheduleMeasurement() {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(measureTarget)
    }

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })

      resizeObserver = new ResizeObserver(scheduleMeasurement)
      resizeObserver.observe(target)
    }

    scheduleMeasurement()
    settleTimer = window.setTimeout(scheduleMeasurement, 350)
    window.addEventListener('resize', scheduleMeasurement)
    window.addEventListener('scroll', scheduleMeasurement, true)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(settleTimer)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', scheduleMeasurement)
      window.removeEventListener('scroll', scheduleMeasurement, true)
    }
  }, [hasStartedTour, open, step.target])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        void finishOnboarding()
        return
      }

      if (!hasStartedTour) {
        if (event.key === 'ArrowRight' || event.key === 'Enter') {
          setHasStartedTour(true)
        }
        return
      }

      if (event.key === 'ArrowLeft' && stepIndex > 0) {
        setStepIndex((current) => current - 1)
      }

      if (event.key === 'ArrowRight' && !isLastStep) {
        setStepIndex((current) => current + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasStartedTour, isLastStep, open, stepIndex])

  const spotlight = useMemo(() => {
    if (!targetRect) return null

    const top = Math.max(targetRect.top - SPOTLIGHT_PADDING, 0)
    const left = Math.max(targetRect.left - SPOTLIGHT_PADDING, 0)
    const right = Math.min(
      targetRect.right + SPOTLIGHT_PADDING,
      window.innerWidth
    )
    const bottom = Math.min(
      targetRect.bottom + SPOTLIGHT_PADDING,
      window.innerHeight
    )

    return {
      top,
      right,
      bottom,
      left,
      width: Math.max(right - left, 0),
      height: Math.max(bottom - top, 0),
    }
  }, [targetRect])

  const tooltipStyle = useMemo<CSSProperties>(() => {
    if (typeof window === 'undefined') return {}

    if (window.innerWidth < 768 || !spotlight) {
      return {
        left: VIEWPORT_GAP,
        right: VIEWPORT_GAP,
        bottom: VIEWPORT_GAP,
      }
    }

    const availableRight = window.innerWidth - spotlight.right
    const availableLeft = spotlight.left
    const availableBelow = window.innerHeight - spotlight.bottom

    if (availableRight >= TOOLTIP_WIDTH + VIEWPORT_GAP * 2) {
      return {
        left: spotlight.right + VIEWPORT_GAP,
        top: clamp(
          spotlight.top,
          VIEWPORT_GAP,
          window.innerHeight - TOOLTIP_HEIGHT_ESTIMATE - VIEWPORT_GAP
        ),
        width: TOOLTIP_WIDTH,
      }
    }

    if (availableLeft >= TOOLTIP_WIDTH + VIEWPORT_GAP * 2) {
      return {
        left: spotlight.left - TOOLTIP_WIDTH - VIEWPORT_GAP,
        top: clamp(
          spotlight.top,
          VIEWPORT_GAP,
          window.innerHeight - TOOLTIP_HEIGHT_ESTIMATE - VIEWPORT_GAP
        ),
        width: TOOLTIP_WIDTH,
      }
    }

    const left = clamp(
      spotlight.left,
      VIEWPORT_GAP,
      window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_GAP
    )

    if (availableBelow >= TOOLTIP_HEIGHT_ESTIMATE + VIEWPORT_GAP) {
      return {
        left,
        top: spotlight.bottom + VIEWPORT_GAP,
        width: TOOLTIP_WIDTH,
      }
    }

    return {
      left,
      bottom: window.innerHeight - spotlight.top + VIEWPORT_GAP,
      width: TOOLTIP_WIDTH,
    }
  }, [spotlight])

  async function finishOnboarding() {
    if (isSaving) return

    setIsSaving(true)
    setError('')

    try {
      const updatedUser = await completeOnboarding()
      saveStoredUser(updatedUser)
      onCompleted(updatedUser)
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Unable to save your onboarding progress.'
        )
      )
    } finally {
      setIsSaving(false)
    }
  }

  function goToPreviousStep() {
    setError('')
    setStepIndex((current) => Math.max(current - 1, 0))
  }

  function goToNextStep() {
    setError('')

    if (isLastStep) {
      void finishOnboarding()
      return
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1))
  }

  if (!open || typeof document === 'undefined') return null

  if (!hasStartedTour) {
    return createPortal(
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="requester-onboarding-title"
      >
        <div className="w-full max-w-xl overflow-hidden rounded-xl border bg-white shadow-2xl">
          <div className="border-b bg-slate-50 px-6 py-5 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <LayoutDashboard className="size-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Getting started
                  </p>
                  <h2
                    id="requester-onboarding-title"
                    className="mt-1 text-xl font-semibold sm:text-2xl"
                  >
                    Welcome to OfficeFlow, {user.name}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-slate-200 hover:text-foreground"
                aria-label="Skip getting started guide"
                disabled={isSaving}
                onClick={() => void finishOnboarding()}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-7">
            <p className="text-sm leading-6 text-muted-foreground">
              This requester workspace keeps your service requests,
              appointments, office replies, and account settings in one place.
              Start the quick tour to see where everything lives.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {workspaceModules.map((module) => {
                const ModuleIcon = module.icon

                return (
                  <div
                    key={module.label}
                    className="flex min-h-12 items-center gap-3 rounded-lg border bg-slate-50 px-3 py-2.5"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-700 shadow-sm">
                      <ModuleIcon className="size-4" />
                    </div>
                    <span className="text-sm font-medium">{module.label}</span>
                  </div>
                )
              })}
            </div>

            {error ? (
              <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="cursor-pointer"
                disabled={isSaving}
                onClick={() => void finishOnboarding()}
              >
                {isSaving ? 'Saving...' : 'Skip tour'}
              </Button>

              <Button
                type="button"
                className="cursor-pointer"
                disabled={isSaving}
                onClick={() => {
                  setError('')
                  setHasStartedTour(true)
                }}
              >
                Start quick tour
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80]"
      role="dialog"
      aria-modal="true"
      aria-label={`OfficeFlow guided tour, step ${stepIndex + 1} of ${steps.length}`}
    >
      {spotlight ? (
        <>
          <TourBackdrop style={{ inset: `0 0 auto 0`, height: spotlight.top }} />
          <TourBackdrop
            style={{
              top: spotlight.top,
              right: window.innerWidth - spotlight.left,
              bottom: window.innerHeight - spotlight.bottom,
              left: 0,
            }}
          />
          <TourBackdrop
            style={{
              top: spotlight.top,
              right: 0,
              bottom: window.innerHeight - spotlight.bottom,
              left: spotlight.right,
            }}
          />
          <TourBackdrop
            style={{ inset: `${spotlight.bottom}px 0 0 0` }}
          />

          <div
            className="pointer-events-auto fixed z-[90] rounded-xl border-2 border-white shadow-[0_0_0_4px_rgba(15,23,42,0.28),0_18px_50px_rgba(15,23,42,0.22)] transition-all duration-200"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
            }}
            aria-hidden="true"
          />
        </>
      ) : (
        <TourBackdrop style={{ inset: 0 }} />
      )}

      <div
        className="fixed z-[100] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border bg-white shadow-2xl"
        style={tooltipStyle}
      >
        <div className="border-b bg-slate-50 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg',
                  step.accent
                )}
              >
                <Icon className="size-5" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {stepIndex === 0 ? `Welcome, ${user.name}` : step.eyebrow}
                </p>
                <p className="mt-0.5 font-semibold">Step {stepIndex + 1} of {steps.length}</p>
              </div>
            </div>

            <button
              type="button"
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-slate-200 hover:text-foreground"
              aria-label="Close guided tour"
              disabled={isSaving}
              onClick={() => void finishOnboarding()}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <h2 className="text-lg font-semibold">{step.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {step.description}
          </p>

          <div
            className="mt-5 grid grid-cols-5 gap-1.5"
            aria-label={`Step ${stepIndex + 1} of ${steps.length}`}
          >
            {steps.map((item, index) => (
              <span
                key={item.title}
                className={cn(
                  'h-1.5 rounded-full transition-colors',
                  index <= stepIndex ? 'bg-primary' : 'bg-slate-200'
                )}
              />
            ))}
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
                  onClick={goToPreviousStep}
                >
                  <ChevronLeft className="size-4" />
                  Back
                </Button>
              ) : null}

              <Button
                type="button"
                className="min-w-24 cursor-pointer"
                disabled={isSaving}
                onClick={goToNextStep}
              >
                {isSaving ? 'Saving...' : isLastStep ? 'Finish' : 'Next'}
                {isLastStep ? (
                  <Check className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function TourBackdrop({ style }: { style: CSSProperties }) {
  return (
    <div
      className="fixed z-[80] bg-slate-950/60 backdrop-blur-[1px]"
      style={style}
      aria-hidden="true"
    />
  )
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum))
}