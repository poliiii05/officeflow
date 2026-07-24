import { FileClock } from 'lucide-react'

import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'

export function SuperAdminAuditLogsPage() {
  return (
    <SuperAdminLayout
      title="Audit logs"
      description="Track important system actions and administrative changes."
      badge="System audit"
    >
      <section className="mx-auto max-w-7xl rounded-lg border bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <FileClock className="size-5" />
          </div>

          <div>
            <h2 className="text-xl font-semibold">Audit logs are next</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              This page will track role changes, status updates, assignment changes, login events, and other admin actions.
            </p>
          </div>
        </div>
      </section>
    </SuperAdminLayout>
  )
}