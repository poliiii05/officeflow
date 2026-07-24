import { ClipboardList } from 'lucide-react'

import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'

export function SuperAdminQueuePage() {
  return (
    <SuperAdminLayout
      title="Monitor service queue"
      description="Review unclaimed tickets and appointments across the service desk."
      badge="Queue monitor"
    >
      <section className="mx-auto max-w-7xl rounded-lg border bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
            <ClipboardList className="size-5" />
          </div>

          <div>
            <h2 className="text-xl font-semibold">Queue monitor is next</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              This page will show all waiting tickets and appointments in one shared queue for super admin review.
            </p>
          </div>
        </div>
      </section>
    </SuperAdminLayout>
  )
}