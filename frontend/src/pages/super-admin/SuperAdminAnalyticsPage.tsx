import { BarChart3 } from 'lucide-react'

import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'

export function SuperAdminAnalyticsPage() {
  return (
    <SuperAdminLayout
      title="Analytics"
      description="Review service volume, completion trends, and staff performance."
      badge="Reports"
    >
      <section className="mx-auto max-w-7xl rounded-lg border bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <BarChart3 className="size-5" />
          </div>

          <div>
            <h2 className="text-xl font-semibold">Analytics are next</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              This page will include charts for ticket volume, appointment trends, resolution time, and staff workload.
            </p>
          </div>
        </div>
      </section>
    </SuperAdminLayout>
  )
}