import {
  BriefcaseBusiness,
  CheckCircle2,
  Inbox,
  UserRoundCheck,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { AssignableStaff } from '@/features/super-admin/super-admin-api'
import { cn } from '@/lib/utils'

type StaffAssignmentPickerProps = {
  staff: AssignableStaff[]
  value: string
  onChange: (value: string) => void
  isLoading: boolean
  error: string
  resourceLabel: 'ticket' | 'appointment'
  currentAssigneeId?: number | null
  currentAssigneeName?: string | null
  accent: 'sky' | 'emerald'
}

export function StaffAssignmentPicker({
  staff,
  value,
  onChange,
  isLoading,
  error,
  resourceLabel,
  currentAssigneeId,
  currentAssigneeName,
  accent,
}: StaffAssignmentPickerProps) {
  const isCurrentAssigneeOnDuty = Boolean(
    currentAssigneeId &&
      staff.some((member) => member.id === currentAssigneeId)
  )

  const isKeepingOffDutyAssignment =
    Boolean(currentAssigneeId) &&
    value === String(currentAssigneeId) &&
    !isCurrentAssigneeOnDuty

  const selectedClasses =
    accent === 'sky'
      ? 'border-sky-300 bg-sky-50 ring-1 ring-sky-200'
      : 'border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200'

  return (
    <section className="rounded-lg border bg-slate-50/70 p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            accent === 'sky'
              ? 'bg-sky-100 text-sky-700'
              : 'bg-emerald-100 text-emerald-700'
          )}
        >
          <UserRoundCheck className="size-5" />
        </div>

        <div className="min-w-0">
          <h3 className="font-medium">Assignment</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Assign this {resourceLabel} to an on-duty staff member, or return
            it to the shared queue.
          </p>
        </div>
      </div>

      {isKeepingOffDutyAssignment && currentAssigneeName ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          <p className="font-medium">Current assignment is preserved</p>
          <p className="mt-1 leading-5 text-amber-800">
            {currentAssigneeName} is currently off duty. Leave the selection
            unchanged to keep ownership, select another on-duty staff member
            to reassign, or return it to the shared queue.
          </p>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Assignment destination
        </p>

        <button
          type="button"
          aria-pressed={!value}
          onClick={() => onChange('')}
          className={cn(
            'mt-2 flex w-full cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 text-left transition-colors hover:bg-slate-50',
            !value
              ? 'border-violet-300 bg-violet-50 ring-1 ring-violet-200'
              : 'border-slate-200'
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-700">
            <Inbox className="size-4" />
          </div>

          <div className="min-w-0">
            <p className="font-medium">Shared queue</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              Make this {resourceLabel} available for any on-duty staff member
              to claim.
            </p>
          </div>
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          On-duty staff
        </p>
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          {staff.length} available
        </Badge>
      </div>

      {isLoading ? (
        <div className="mt-3 rounded-lg border bg-white px-3 py-4 text-sm text-muted-foreground">
          Loading available staff...
        </div>
      ) : null}

      {!isLoading && !staff.length ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-4 text-sm text-amber-900">
          {error || 'No staff members are currently on duty.'}
        </div>
      ) : null}

      {!isLoading && staff.length ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {staff.map((member) => {
            const isSelected = value === String(member.id)

            return (
              <button
                key={member.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange(String(member.id))}
                className={cn(
                  'cursor-pointer rounded-lg border bg-white p-3 text-left transition-colors hover:bg-slate-50',
                  isSelected ? selectedClasses : 'border-slate-200'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{member.name}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  </div>

                  {isSelected ? (
                    <CheckCircle2
                      className={cn(
                        'size-5 shrink-0',
                        accent === 'sky'
                          ? 'text-sky-700'
                          : 'text-emerald-700'
                      )}
                    />
                  ) : null}
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <BriefcaseBusiness className="size-3.5" />
                  <span>
                    {member.active_total} active request
                    {member.active_total === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs">
                  <span className="rounded-md bg-sky-50 px-2 py-1.5 text-sky-700">
                    {member.active_tickets} tickets
                  </span>
                  <span className="rounded-md bg-emerald-50 px-2 py-1.5 text-emerald-700">
                    {member.active_appointments} appts
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}