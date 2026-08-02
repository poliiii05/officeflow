import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  TicketCheck,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardPath } from '@/lib/auth-redirect'
import { getStoredToken, getStoredUser } from '@/lib/auth-storage'

const navItems = [
  { label: 'Features', target: 'features' },
  { label: 'Process', target: 'process' },
  { label: 'Snapshot', target: 'snapshot' },
]

const modules = [
  {
    title: 'Ticket Management',
    description: 'Users can submit concerns while staff classify, claim, update, and resolve tickets.',
    icon: TicketCheck,
  },
  {
    title: 'Appointment Scheduling',
    description: 'Visitors and employees can request appointments with schedule and status tracking.',
    icon: CalendarCheck,
  },
  {
    title: 'Staff Queue Operations',
    description: 'Shared queues help staff claim waiting requests and continue assigned work.',
    icon: Users,
  },
  {
    title: 'Requester Notifications',
    description: 'Users receive updates when staff replies, schedules, resolves, or changes request status.',
    icon: Bell,
  },
  {
    title: 'Role-Based Access',
    description: 'Separate workspaces for requesters, staff, and super admins keep access organized.',
    icon: ShieldCheck,
  },
  {
    title: 'Service Records',
    description: 'Tickets, appointments, activities, shifts, and audit logs stay traceable for review.',
    icon: ClipboardList,
  },
]

const workflowSteps = [
  {
    title: 'Create a request',
    description: 'A requester logs in and submits a ticket or appointment request.',
  },
  {
    title: 'Queue review',
    description: 'New items enter the shared queue and become visible to available staff.',
  },
  {
    title: 'Staff claims work',
    description: 'An on-duty staff member claims the request and starts handling it.',
  },
  {
    title: 'Progress updates',
    description: 'Staff can update status, add replies, and keep the requester informed.',
  },
  {
    title: 'Resolution',
    description: 'Completed work is marked resolved, closed, completed, or cancelled.',
  },
  {
    title: 'Admin monitoring',
    description: 'Super admins review users, workload, audit logs, analytics, and system settings.',
  },
]

const statusItems = [
  {
    label: 'Queue waiting',
    value: 'Live',
    description: 'Unclaimed tickets and appointments',
    icon: ClipboardList,
  },
  {
    label: 'Staff coverage',
    value: 'Shift',
    description: 'Tracks on-duty staff sessions',
    icon: Users,
  },
  {
    label: 'Request updates',
    value: 'Notify',
    description: 'Replies and status notifications',
    icon: Bell,
  },
  {
    label: 'Admin tools',
    value: 'Audit',
    description: 'Logs, analytics, roles, and settings',
    icon: ShieldCheck,
  },
]

function scrollToSection(target: string) {
  document.getElementById(target)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

export function LandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = getStoredToken()
    const user = getStoredUser()

    if (token && user) {
      navigate(getDashboardPath(user), { replace: true })
    }
  }, [navigate])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">OfficeFlow</p>
              <p className="text-base font-semibold">Appointment & Ticketing</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {navItems.map((item) => (
              <button
                key={item.target}
                type="button"
                onClick={() => scrollToSection(item.target)}
                className="cursor-pointer transition-colors hover:text-foreground"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login" className={buttonVariants({ variant: 'ghost' })}>
              Login
            </Link>

            <Link to="/register" className={buttonVariants()}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="reveal-on-scroll mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:py-16">
        <div>
          <Badge className="mb-5 w-fit" variant="secondary">
            Office service portal
          </Badge>

          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl">
            Manage office requests, tickets, and appointments in one focused system.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            OfficeFlow gives requesters a simple way to ask for help while staff manage queueing,
            schedules, replies, and service records from one workspace.
          </p>

          <div className="mt-8 flex">
            <Link to="/login" className={buttonVariants({ size: 'lg' })}>
              Create request
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-semibold">3</p>
              <p className="text-sm text-muted-foreground">Role-based workspaces</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">2</p>
              <p className="text-sm text-muted-foreground">Request channels</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">Live</p>
              <p className="text-sm text-muted-foreground">Queue updates with Reverb</p>
            </div>
          </div>
        </div>

        <Card className="self-center">
          <CardHeader>
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayoutDashboard className="size-6" />
            </div>
            <CardTitle>Workspace preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflowSteps.slice(0, 4).map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-lg border bg-background p-4">
                <CheckCircle2 className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section id="features" className="reveal-on-scroll border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <Badge variant="outline">Features</Badge>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built for office service work</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                The main modules are focused on request intake, staff handling, user updates, and admin control.
              </p>
            </div>
            <ShieldCheck className="hidden size-9 text-muted-foreground md:block" />
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon

              return (
                <Card key={module.title} className="h-full">
                  <CardHeader>
                    <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle>{module.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">{module.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section id="process" className="reveal-on-scroll border-t">
        <div className="mx-auto grid max-w-7xl items-start gap-8 px-6 py-16 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <Badge variant="outline">Process</Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Clear flow from request to record</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Each request moves through a simple lifecycle so staff know what to do next and users can follow progress.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="rounded-lg border bg-background p-4">
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="snapshot" className="reveal-on-scroll border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8">
            <Badge variant="outline">Snapshot</Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">What the system monitors</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              These indicators describe the live information shown across requester, staff, and super admin workspaces.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {statusItems.map((item) => {
              const Icon = item.icon

              return (
                <Card key={item.label} className="h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <Icon className="size-5 text-muted-foreground" />
                      <span className="text-2xl font-semibold">{item.value}</span>
                    </div>
                    <p className="mt-4 font-medium">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}