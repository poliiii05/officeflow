import { Search, ShieldCheck } from 'lucide-react'

import { Input } from '@/components/ui/input'

export function UserManagementPanel() {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">User management</h2>
              <p className="text-sm text-muted-foreground">
                Search users and manage system access roles.
              </p>
            </div>
          </div>

          <div className="relative lg:w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name, email, role..." className="bg-white pl-9" />
          </div>
        </div>

        <div className="px-5 py-8 text-sm text-muted-foreground">
          User management records will appear here after we move the real code into this feature module.
        </div>
      </div>
    </section>
  )
}