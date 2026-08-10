import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  ClipboardList,
  History,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  TicketCheck,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { AuthUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

type StaffOnboardingDialogProps = {
  user: AuthUser
  open: boolean
  onCompleted: () => void
}

type TourStep = {
  target: string
  route?: string
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
}

type CardPosition = Pick<CSSProperties, 'left' | 'top' | 'transform'>

const centerCardPosition: CardPosition = {
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
}

export function getStaffOnboardingKey(user: AuthUser) {
  return `officeflow.staff_onboarding.${user.id}.${user.role}`
}

function getStaffOnboardingProgressKey(user: AuthUser) {
  return `${getStaffOnboardingKey(user)}.progress`
}

export function isStaffOnboardingDone(user: AuthUser | null) {
  if (!user || !['staff', 'super_admin'].includes(user.role)) return true
  if (typeof window === 'undefined') return true

  return localStorage.getItem(getStaffOnboardingKey(user)) === 'done'
}

function getTourSteps(user: AuthUser): TourStep[] {
  if (user.role === 'super_admin') {
    return [
      {
        target: '[data-tour="workspace-identity"]',
        eyebrow: 'Workspace identity',
        title: 'This shows your admin identity',
        description: 'Your role and display name appear here while you manage OfficeFlow.',
        icon: ShieldCheck,
      },
      {
        target: 'a[href="/super-admin/users"]',
        eyebrow: 'Users',
        title: 'Manage user access',
        description: 'Review accounts, change roles, and control who can access staff or admin tools.',
        icon: UserCog,
      },
      {
        target: 'a[href="/super-admin/staff"]',
        eyebrow: 'Staff',
        title: 'Monitor staff workload',
        description: 'Check who is on duty, who has assigned work, and who may need help.',
        icon: Users,
      },
      {
        target: 'a[href="/super-admin/audit-logs"]',
        eyebrow: 'Audit logs',
        title: 'Track system activity',
        description: 'Review role changes, staff shifts, queue actions, and important system events.',
        icon: History,
      },
      {
        target: '[data-tour="staff-display-name"]',
        route: '/super-admin/account-settings',
        eyebrow: 'Display name',
        title: 'Set your admin display name',
        description: 'Use the name staff should recognize in admin records and system activity.',
        icon: Settings,
      },
    ]
  }

  return [
    {
      target: '[data-tour="workspace-identity"]',
      eyebrow: 'Workspace identity',
      title: 'This shows your staff identity',
      description: 'Your staff role and display name appear here while you work on requests.',
      icon: BadgeCheck,
    },
    {
      target: 'a[href="/staff/queue"]',
      eyebrow: 'Queue',
      title: 'Open the shared queue',
      description: 'Claim unassigned tickets and pending appointments when you are on shift.',
      icon: ClipboardList,
    },
    {
      target: 'a[href="/staff/work"]',
      eyebrow: 'My work',
      title: 'Continue assigned work',
      description: 'Review assigned requests, update statuses, and send replies to requesters.',
      icon: TicketCheck,
    },
    {
      target: 'a[href="/staff/shifts"]',
      eyebrow: 'Shift history',
      title: 'Track your shift records',
      description: 'Review your time in, time out, early out, and completed work for each shift.',
      icon: History,
    },
    {
      target: '[data-tour="staff-display-name"]',
      route: '/staff/settings',
      eyebrow: 'Display name',
      title: 'Set what people should call you',
      description: 'Use a short name like John, Sheesh, or Front Desk Lead for staff replies.',
      icon: Settings,
    },
  ]
}

function getCardPosition(targetRect: DOMRect | null): CardPosition {
  if (!targetRect || typeof window === 'undefined') {
    return centerCardPosition
  }

  const cardWidth = 420
  const gap = 20
  const viewportPadding = 20
  const top = Math.min(
    Math.max(targetRect.top, viewportPadding),
    window.innerHeight - 260
  )

  const hasRightSpace = targetRect.right + gap + cardWidth < window.innerWidth
  const hasLeftSpace = targetRect.left - gap - cardWidth > viewportPadding

  if (hasRightSpace) {
    return {
      left: targetRect.right + gap,
      top,
      transform: 'none',
    }
  }

  if (hasLeftSpace) {
    return {
      left: targetRect.left - gap - cardWidth,
      top,
      transform: 'none',
    }
  }

  return {
    left: '50%',
    top: Math.min(targetRect.bottom + gap, window.innerHeight - 260),
    transform: 'translateX(-50%)',
  }
}

export function StaffOnboardingDialog({
  user,
  open,
  onCompleted,
}: StaffOnboardingDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const progressKey = getStaffOnboardingProgressKey(user)

  const steps = useMemo(() => getTourSteps(user), [user])
  const [started, setStarted] = useState(() => sessionStorage.getItem(progressKey) !== null)
  const [stepIndex, setStepIndex] = useState(() => {
    const savedStep = Number(sessionStorage.getItem(progressKey) ?? 0)
    return Number.isFinite(savedStep) ? Math.min(Math.max(savedStep, 0), steps.length - 1) : 0
  })
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [cardStyle, setCardStyle] = useState<CardPosition>(centerCardPosition)

  const step = steps[stepIndex]
  const Icon = step.icon
  const isDisplayNameStep = step.target === '[data-tour="staff-display-name"]'

  const nextCardPosition = useMemo(() => getCardPosition(targetRect), [targetRect])

  useEffect(() => {
    if (!started) {
      setCardStyle(centerCardPosition)
      return
    }

    // Previously this always re-ran off `nextCardPosition`, which becomes
    // centerCardPosition the instant targetRect is cleared on step change —
    // causing a visible snap-to-center flash before the real target is
    // located ~160ms+ later. Skipping the update while targetRect is null
    // leaves the card at its last known position instead, so it slides
    // directly from the old spot to the new one once found. Center is now
    // only ever used before any position has been established at all
    // (the very first step of the tour).
    if (!targetRect) return

    const timer = window.setTimeout(() => {
      setCardStyle(nextCardPosition)
    }, 120)

    return () => window.clearTimeout(timer)
  }, [nextCardPosition, started, targetRect])

  useEffect(() => {
    if (!open || !started) return

    sessionStorage.setItem(progressKey, String(stepIndex))
    setTargetRect(null)

    if (step.route && location.pathname !== step.route) {
      navigate(step.route)
      return
    }

    let cancelled = false

    function updateTargetRect() {
      const element = document.querySelector(step.target)

      if (!element || cancelled) {
        setTargetRect(null)
        return
      }

      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!cancelled) {
            setTargetRect(element.getBoundingClientRect())
          }
        })
      })
    }

    const timer = window.setTimeout(updateTargetRect, 160)

    window.addEventListener('resize', updateTargetRect)
    window.addEventListener('scroll', updateTargetRect, true)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      window.removeEventListener('resize', updateTargetRect)
      window.removeEventListener('scroll', updateTargetRect, true)
    }
  }, [location.pathname, navigate, open, progressKey, started, step, stepIndex])

  function finishTour() {
    localStorage.setItem(getStaffOnboardingKey(user), 'done')
    sessionStorage.removeItem(progressKey)
    onCompleted()
  }

  function startTour() {
    sessionStorage.setItem(progressKey, '0')
    setStarted(true)
    setStepIndex(0)
  }

  function nextStep() {
    if (stepIndex >= steps.length - 1) {
      finishTour()
      return
    }

    const nextIndex = stepIndex + 1
    const next = steps[nextIndex]

    sessionStorage.setItem(progressKey, String(nextIndex))
    setStepIndex(nextIndex)

    if (next.route && location.pathname !== next.route) {
      setTargetRect(null)
      navigate(next.route)
    }
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      {!started ? <div className="absolute inset-0 bg-slate-950/45" /> : null}

      {started && targetRect ? (
        <div
          className={cn(
            'pointer-events-none absolute rounded-xl border-2 border-sky-400 bg-transparent shadow-[0_0_0_9999px_rgba(15,23,42,0.62)] transition-all duration-500 ease-out',
            isDisplayNameStep && 'animate-pulse'
          )}
          style={{
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      ) : started ? (
        <div className="absolute inset-0 bg-slate-950/35 transition-opacity duration-200" />
      ) : null}

      {!started ? (
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border bg-white shadow-xl">
            <div className="border-b bg-slate-50 px-7 py-6">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <LayoutDashboard className="size-5" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Getting started
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    Welcome to OfficeFlow
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    We will walk you through the key areas of your workspace.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 px-7 py-5 sm:grid-cols-3">
              <div className="rounded-lg border bg-sky-50 p-3">
                <p className="text-sm font-medium">Know your modules</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Queue, work, records, and settings.
                </p>
              </div>

              <div className="rounded-lg border bg-emerald-50 p-3">
                <p className="text-sm font-medium">Work clearly</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Claim and update requests while on shift.
                </p>
              </div>

              <div className="rounded-lg border bg-violet-50 p-3">
                <p className="text-sm font-medium">Set identity</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Add a display name for staff replies.
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3 border-t px-7 py-5">
              <Button variant="outline" className="cursor-pointer" onClick={finishTour}>
                Skip tour
              </Button>

              <Button className="cursor-pointer" onClick={startTour}>
                Start tour
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="absolute w-[min(420px,calc(100vw-32px))] overflow-hidden rounded-xl border bg-white shadow-xl transition-[left,top,transform] duration-500 ease-out"
          style={cardStyle}
        >
          <div className="border-b px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <Icon className="size-5" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {step.eyebrow}
                </p>
                <h2 className="mt-1 text-xl font-semibold">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {stepIndex + 1} of {steps.length}
            </p>

            <div className="flex gap-2">
              <Button variant="outline" className="cursor-pointer" onClick={finishTour}>
                Skip
              </Button>

              <Button className="cursor-pointer" onClick={nextStep}>
                {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}