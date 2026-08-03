import { CheckCircle2, Mail } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { AuthUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

export function EmailSection({
  user,
  className,
}: {
  user: AuthUser
  className?: string
}) {
  const isVerified = Boolean(user.email_verified_at || user.google_id)

  return (
    <section className={cn('overflow-hidden rounded-lg border bg-white shadow-sm', className)}>
      <div className="border-b bg-slate-50 px-5 py-4">
        <h2 className="font-semibold">Email and sign-in</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the primary email and sign-in method connected to this account.
        </p>
      </div>

      <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <Mail className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="break-all font-medium">{user.email}</p>
              <p className="mt-1 text-sm text-muted-foreground">Primary email address</p>
            </div>
          </div>

          <Badge
            className={cn(
              'w-fit border-0',
              isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            )}
          >
            <CheckCircle2 className="mr-1 size-3.5" />
            {isVerified ? 'Verified' : 'Verification required'}
          </Badge>
        </div>
      </div>
    </section>
  )
}