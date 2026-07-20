import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  Bot,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const modules = [
  {
    title: 'Ticket Management',
    description: 'Receive, classify, assign, and resolve office service requests with clear status tracking.',
    icon: TicketCheck,
  },
  {
    title: 'Appointment Scheduling',
    description: 'Let users request appointments while staff manage approvals, queues, and reminders.',
    icon: CalendarCheck,
  },
  {
    title: 'AI Assistance',
    description: 'Summarize tickets, suggest categories, and draft staff replies while keeping humans in control.',
    icon: Bot,
  },
]

const workflowSteps = [
  {
    title: 'User submits a request',
    description: 'Employees and visitors can create tickets or appointment requests from the portal.',
  },
  {
    title: 'System routes the request',
    description: 'Requests are organized by category, priority, status, and assigned office.',
  },
  {
    title: 'Staff handles the queue',
    description: 'Staff review, update, approve, schedule, or resolve the request.',
  },
  {
    title: 'User tracks the status',
    description: 'Users can view progress and receive updates once notifications are added.',
  },
]

const statusItems = [
  {
    label: 'Open tickets',
    value: '24',
    icon: TicketCheck,
  },
  {
    label: 'Today appointments',
    value: '12',
    icon: CalendarCheck,
  },
  {
    label: 'Staff queues',
    value: '4',
    icon: Users,
  },
  {
    label: 'Notifications soon',
    value: 'Ready',
    icon: Bell,
  },
]

export function LandingPage() {
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
            <a href="#modules" className="hover:text-foreground">Modules</a>
            <a href="#workflow" className="hover:text-foreground">Workflow</a>
            <a href="#status" className="hover:text-foreground">Status</a>
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

      <section className="reveal-on-scroll mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-20">
        <div className="flex flex-col justify-center">
          <Badge className="mb-5 w-fit" variant="secondary">
            Office appointment and ticketing system
          </Badge>

          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl">
            Manage office requests, tickets, and appointments in one focused system.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            OfficeFlow helps users submit concerns, book appointments, and track status while staff manage queues, replies, approvals, and AI-assisted summaries.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className={buttonVariants({ size: 'lg' })}>
              Create request
              <ArrowRight className="size-4" />
            </Link>

            <Link to="/login" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              Staff login
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-semibold">24</p>
              <p className="text-sm text-muted-foreground">Open tickets sample</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">12</p>
              <p className="text-sm text-muted-foreground">Today appointments</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">AI</p>
              <p className="text-sm text-muted-foreground">Assisted workflow</p>
            </div>
          </div>
        </div>

        <Card className="self-center">
          <CardHeader>
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayoutDashboard className="size-6" />
            </div>
            <CardTitle>Operational Dashboard Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workflowSteps.map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-lg border p-4">
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

      <section id="modules" className="reveal-on-scroll border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <Badge variant="outline">Core modules</Badge>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built for real office workflows</h2>
            </div>
            <ShieldCheck className="hidden size-9 text-muted-foreground md:block" />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon

              return (
                <Card key={module.title}>
                  <CardHeader>
                    <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle>{module.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {module.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section id="workflow" className="reveal-on-scroll border-t">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Badge variant="outline">Workflow</Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">From request submission to resolution</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              The system keeps each request visible, assigned, and trackable so users and staff know what happens next.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {workflowSteps.map((step, index) => (
              <Card key={step.title}>
                <CardHeader>
                  <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="status" className="reveal-on-scroll border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="mb-8">
            <Badge variant="outline">Status</Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">System snapshot</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              These are sample numbers for the landing page. Later, these can come from real dashboard data.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {statusItems.map((item) => {
              const Icon = item.icon

              return (
                <Card key={item.label}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <Icon className="size-5 text-muted-foreground" />
                      <span className="text-2xl font-semibold">{item.value}</span>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
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