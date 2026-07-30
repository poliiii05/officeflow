import { CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { AuthUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

export function EmailSection({ user }: { user: AuthUser }) {
  const isGoogleAccount = Boolean(user.google_id)
  const isVerified = Boolean(user.email_verified_at || user.google_id)

  return (
    <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="border-b bg-slate-50 px-5 py-4">
        <h2 className="font-semibold">Email and sign-in</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the email connected to this OfficeFlow account.
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded-lg border bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <p className="break-all font-medium">{user.email}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Primary email address</p>
            </div>

            <Badge
              className={cn(
                'w-fit border-0',
                isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              )}
            >
              {isVerified ? 'Verified' : 'Not verified'}
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2">
              {isGoogleAccount ? (
                <ShieldCheck className="size-4 text-violet-700" />
              ) : (
                <KeyRound className="size-4 text-slate-700" />
              )}
              <p className="font-medium">Sign-in method</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {isGoogleAccount
                ? 'This account signs in through Google OAuth.'
                : 'This account signs in through email and password.'}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-700" />
              <p className="font-medium">Account verification</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {isVerified
                ? 'This email is trusted for account access.'
                : 'Email verification can be connected after SMTP setup.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}