import { Users } from 'lucide-react'

import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'

export function SuperAdminStaffPage() {
  return (
    <SuperAdminLayout
      title="Manage staff operations"
      description="Review staff availability, active workload, and shift coverage."
      badge="Staff management"
    >
      <PlaceholderPanel
        title="Staff management is next"
        description="This page will show staff shift status, active assigned tickets, assigned appointments, and reassignment controls."
        icon={Users}
      />
    </SuperAdminLayout>
  )
}

function PlaceholderPanel({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: typeof Users
}) {
  return (
    <section className="mx-auto max-w-7xl rounded-lg border bg-white p-8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Icon className="size-5" />
        </div>

        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
    </section>
  )
}