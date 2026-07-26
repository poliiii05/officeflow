import { ClipboardList, Clock3 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getSystemStatus, type PublicSystemStatus } from '@/features/super-admin/settings/settings-api'

export function MaintenancePage() {
  const [status, setStatus] = useState<PublicSystemStatus | null>(null)

  useEffect(() => {
    async function loadStatus() {
      try {
        setStatus(await getSystemStatus())
      } catch {
        setStatus(null)
      }
    }

    void loadStatus()
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 text-slate-950">
      <section className="flex w-full max-w-xl flex-col items-center text-center">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
            <ClipboardList className="size-5" />
          </div>

          <div className="text-left">
            <p className="font-semibold">OfficeFlow</p>
            <p className="text-sm text-muted-foreground">Appointment & Ticketing</p>
          </div>
        </div>

        <p className="text-sm font-medium text-amber-700">System maintenance</p>

        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          We&apos;ll be back soon.
        </h1>

        <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
          {status?.office_name ?? 'OfficeFlow'} is temporarily unavailable while we update office
          requests, appointments, and ticketing tools.
        </p>

        <div className="mt-8 inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <Clock3 className="size-4" />
          Maintenance mode is currently active
        </div>
      </section>
    </main>
  )
}