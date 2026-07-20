import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  TicketCheck,
} from 'lucide-react'

import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

const workflow = [
  'Submit requests and appointment concerns',
  'Route tickets to the right department',
  'Track staff workload and request progress',
  'Send notifications and reminders',
]

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">OfficeFlow</p>
              <p className="text-base font-semibold">Appointment & Ticketing</p>
            </div>
          </div>

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

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-20">
        <div className="flex flex-col justify-center">
          <Badge className="mb-5 w-fit" variant="secondary">
            Phase 1A Landing Page
          </Badge>

          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl">
            Manage office requests, tickets, and appointments in one focused system.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            OfficeFlow helps users submit concerns, book appointments, and track status while staff manage queues, replies, approvals, and AI-assisted summaries.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg">
              Create request
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline">
              View staff console
            </Button>
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
            {workflow.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border p-4">
                <CheckCircle2 className="mt-0.5 size-5 text-primary" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section id="modules" className="border-t bg-muted/30">
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
    </main>
  )
}