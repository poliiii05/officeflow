import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Database,
  Loader2,
  LockKeyhole,
  Power,
  RotateCcw,
  Save,
  ShieldCheck,
  TicketCheck,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  getSuperAdminSettings,
  updateSuperAdminSettings,
  type SystemSettings,
} from '@/features/super-admin/settings/settings-api'
import { cn } from '@/lib/utils'

type BooleanSettingKey = {
  [Key in keyof SystemSettings]: SystemSettings[Key] extends boolean ? Key : never
}[keyof SystemSettings]

const defaultSettings: SystemSettings = {
  maintenance_mode: false,
  office_name: 'OfficeFlow Service Desk',
  support_email: 'hello@example.com',
  timezone: 'Asia/Manila',
  office_note: 'Centralized appointment and ticketing workspace for office requests.',
  allow_user_cancellation: true,
  cancellation_window: 'before_claim',
  appointment_lead_days: 1,
  default_ticket_priority: 'medium',
  staff_shift_required: true,
  audit_log_retention: '180',
}

function getTimezones() {
  const intlWithTimezones = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[]
  }

  return (
    intlWithTimezones.supportedValuesOf?.('timeZone') ?? [
      'Asia/Manila',
      'UTC',
      'America/New_York',
      'Europe/London',
      'Asia/Tokyo',
    ]
  )
}

function settingsChanged(current: SystemSettings, saved: SystemSettings) {
  return JSON.stringify(current) !== JSON.stringify(saved)
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const apiError = error as { response?: { data?: { message?: string } } }
    return apiError.response?.data?.message ?? 'Unable to save system settings.'
  }

  return 'Unable to save system settings.'
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [savedSettings, setSavedSettings] = useState<SystemSettings>(defaultSettings)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isMaintenanceConfirmOpen, setIsMaintenanceConfirmOpen] = useState(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

  const timezones = useMemo(() => getTimezones(), [])
  const hasUnsavedChanges = settingsChanged(settings, savedSettings)

  useEffect(() => {
    let isActive = true

    async function loadSettings() {
      setIsLoading(true)
      setError('')

      try {
        const data = await getSuperAdminSettings()

        if (isActive) {
          setSettings(data)
          setSavedSettings(data)
        }
      } catch {
        if (isActive) {
          setError('Unable to load system settings. Showing default values for now.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadSettings()

    return () => {
      isActive = false
    }
  }, [])

  function updateSetting<Key extends keyof SystemSettings>(key: Key, value: SystemSettings[Key]) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }))
    setSavedAt(null)
    setError('')
  }

  function updateBooleanSetting(key: BooleanSettingKey, value: boolean) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }))
    setSavedAt(null)
    setError('')
  }

  async function saveSettings(nextSettings: SystemSettings) {
  setIsSaving(true)
  setError('')

  try {
    const saved = await updateSuperAdminSettings(nextSettings)

    setSettings(saved)
    setSavedSettings(saved)
    setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
  } catch (saveError) {
    setError(getErrorMessage(saveError))
  } finally {
    setIsSaving(false)
  }
}

function handleMaintenanceChange(value: boolean) {
  if (value === settings.maintenance_mode) {
    return
  }

  if (value) {
    setIsMaintenanceConfirmOpen(true)
    return
  }

  void saveSettings({
    ...settings,
    maintenance_mode: false,
  })
}

function handleConfirmMaintenance() {
  setIsMaintenanceConfirmOpen(false)

  void saveSettings({
    ...settings,
    maintenance_mode: true,
  })
}

async function handleSave() {
  await saveSettings(settings)
}

  function handleRequestReset() {
    setIsResetConfirmOpen(true)
  }

  function handleConfirmReset() {
    setSettings(defaultSettings)
    setSavedAt(null)
    setError('')
    setIsResetConfirmOpen(false)
  }

  return (
    <>
      <section className="mx-auto max-w-7xl space-y-5">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section
          className={cn(
            'overflow-hidden rounded-lg border bg-white shadow-sm',
            settings.maintenance_mode ? 'border-amber-200' : 'border-emerald-200'
          )}
        >
          <div
            className={cn(
              'flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between',
              settings.maintenance_mode ? 'bg-amber-50' : 'bg-emerald-50'
            )}
          >
            <div className="flex select-none items-start gap-4">
              <div
                className={cn(
                  'flex size-12 shrink-0 items-center justify-center rounded-lg border bg-white',
                  settings.maintenance_mode
                    ? 'border-amber-200 text-amber-700'
                    : 'border-emerald-200 text-emerald-700'
                )}
              >
                <Power className="size-5" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">System availability</h2>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'border-0',
                      settings.maintenance_mode
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    )}
                  >
                    {settings.maintenance_mode ? 'Maintenance on' : 'Online'}
                  </Badge>
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Control whether normal requester access is available. Staff and super admins can
                  still sign in while maintenance mode is active.
                </p>
              </div>
            </div>

            <OffOnToggle checked={settings.maintenance_mode} onChange={handleMaintenanceChange} />
          </div>

          <div className="border-t bg-white px-5 py-4">
            <div
              className={cn(
                'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
                settings.maintenance_mode
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              )}
            >
              {settings.maintenance_mode ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              )}

              <p>
                {settings.maintenance_mode
                  ? 'Maintenance mode will redirect normal users to the maintenance screen after saving.'
                  : 'OfficeFlow is available. Normal users can continue using tickets and appointments.'}
              </p>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading system settings...
          </div>
        ) : null}

        {savedAt ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" />
            Settings saved at {savedAt}.
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-5">
            <SettingsSection
              icon={Building2}
              title="System profile"
              description="Workspace identity, support contact, and timezone display."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Office name" htmlFor="officeName">
                  <Input
                    id="officeName"
                    value={settings.office_name}
                    onChange={(event) => updateSetting('office_name', event.target.value)}
                  />
                </Field>

                <Field label="Support email" htmlFor="supportEmail">
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.support_email}
                    onChange={(event) => updateSetting('support_email', event.target.value)}
                  />
                </Field>

                <Field label="System timezone" htmlFor="timezone">
                  <TimezoneSelect
                    id="timezone"
                    value={settings.timezone}
                    options={timezones}
                    onChange={(value) => updateSetting('timezone', value)}
                  />
                </Field>

                <div className="select-none rounded-lg border bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium">Current system time</p>
                  <LiveClock timezone={settings.timezone} />
                </div>
              </div>

              <Field label="Office note" htmlFor="officeNote">
                <Textarea
                  id="officeNote"
                  value={settings.office_note}
                  onChange={(event) => updateSetting('office_note', event.target.value)}
                  className="min-h-20 resize-none"
                />
              </Field>
            </SettingsSection>

            <SettingsSection
              icon={TicketCheck}
              title="Request rules"
              description="Controls for requester cancellation, priority defaults, and staff claiming."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <ControlRow
                  title="Requester cancellation"
                  description="Allow users to cancel eligible requests before staff handling."
                  checked={settings.allow_user_cancellation}
                  onChange={(value) => updateBooleanSetting('allow_user_cancellation', value)}
                />

                <ControlRow
                  title="Staff shift required"
                  description="Prevent claim actions unless staff are checked in."
                  checked={settings.staff_shift_required}
                  onChange={(value) => updateBooleanSetting('staff_shift_required', value)}
                />

                <Field label="Cancellation window" htmlFor="cancellationWindow">
                  <SettingSelect
                    id="cancellationWindow"
                    value={settings.cancellation_window}
                    onChange={(value) =>
                      updateSetting(
                        'cancellation_window',
                        value as SystemSettings['cancellation_window']
                      )
                    }
                    options={[
                      { label: 'Before staff claim', value: 'before_claim' },
                      { label: 'Before resolution', value: 'before_resolution' },
                      { label: 'Disabled', value: 'disabled' },
                    ]}
                  />
                </Field>

                <Field label="Default ticket priority" htmlFor="defaultTicketPriority">
                  <SettingSelect
                    id="defaultTicketPriority"
                    value={settings.default_ticket_priority}
                    onChange={(value) =>
                      updateSetting(
                        'default_ticket_priority',
                        value as SystemSettings['default_ticket_priority']
                      )
                    }
                    options={[
                      { label: 'Low', value: 'low' },
                      { label: 'Medium', value: 'medium' },
                      { label: 'High', value: 'high' },
                      { label: 'Urgent', value: 'urgent' },
                    ]}
                  />
                </Field>

                <Field label="Appointment lead time" htmlFor="appointmentLeadDays">
                  <SettingSelect
                    id="appointmentLeadDays"
                    value={String(settings.appointment_lead_days)}
                    onChange={(value) => updateSetting('appointment_lead_days', Number(value))}
                    options={[
                      { label: 'Same day allowed', value: '0' },
                      { label: '1 day before', value: '1' },
                      { label: '2 days before', value: '2' },
                      { label: '3 days before', value: '3' },
                    ]}
                  />
                </Field>
              </div>
            </SettingsSection>
          </div>

          <div className="space-y-5">
            <SettingsSection
              icon={LockKeyhole}
              title="Security policy"
              description="Enforced by the backend. Shown here for visibility, not editable from this page."
            >
              <div className="space-y-3">
                <PolicyRow
                  icon={ShieldCheck}
                  label="Role changes"
                  value="Typed confirmation required"
                  enforced
                />
                <PolicyRow
                  icon={LockKeyhole}
                  label="Protected routes"
                  value="Sanctum token authentication"
                  enforced
                />
                <PolicyRow
                  icon={Clock3}
                  label="API throttling"
                  value="Rate limits enabled in Laravel routes"
                  enforced
                />

                <Field label="Audit log retention" htmlFor="auditLogRetention">
                  <SettingSelect
                    id="auditLogRetention"
                    value={settings.audit_log_retention}
                    onChange={(value) =>
                      updateSetting(
                        'audit_log_retention',
                        value as SystemSettings['audit_log_retention']
                      )
                    }
                    options={[
                      { label: '90 days', value: '90' },
                      { label: '180 days', value: '180' },
                      { label: '365 days', value: '365' },
                    ]}
                  />
                </Field>
              </div>
            </SettingsSection>

            <SettingsSection
              icon={Database}
              title="Data policy"
              description="Record handling rules for requests, appointments, and audit activity."
            >
              <div className="space-y-3">
                <PolicyRow icon={TicketCheck} label="Ticket records" value="Keep for service history" enforced />
                <PolicyRow icon={CalendarClock} label="Appointments" value="Keep for schedule history" enforced />
                <PolicyRow icon={ShieldCheck} label="Audit visibility" value="Super admin only" enforced />
                <PolicyRow icon={Clock3} label="Deletion policy" value="Archive before permanent delete" enforced />
              </div>
            </SettingsSection>
          </div>
        </div>

        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-lg border bg-white/95 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="select-none">
            <div className="flex items-center gap-2">
              <p className="font-medium">System settings</p>
              {hasUnsavedChanges ? (
                <Badge variant="secondary" className="border-0 bg-amber-100 text-amber-700">
                  Unsaved changes
                </Badge>
              ) : (
                <Badge variant="secondary" className="border-0 bg-emerald-100 text-emerald-700">
                  Synced
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Saved changes apply to OfficeFlow through the backend settings API.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer gap-2"
              onClick={handleRequestReset}
              disabled={isLoading || isSaving}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>

            <Button
              type="button"
              className="cursor-pointer gap-2"
              onClick={handleSave}
              disabled={isLoading || isSaving || !hasUnsavedChanges}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={isMaintenanceConfirmOpen} onOpenChange={setIsMaintenanceConfirmOpen}>
        <DialogContent className="!max-w-xl overflow-hidden p-0">
          <div className="border-b bg-amber-50 px-6 py-5">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700">
                  <AlertTriangle className="size-5" />
                </div>

                <div>
                  <DialogTitle className="text-xl">Turn on maintenance mode?</DialogTitle>
                  <DialogDescription className="mt-2 leading-6">
                    Normal users will be redirected to the maintenance screen after you save this
                    change. Staff and super admins can still access operational tools.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="space-y-3 px-6 py-5">
            <div className="rounded-lg border bg-white p-4">
              <p className="font-medium">Expected behavior</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Requesters will temporarily stop accessing dashboards, tickets, and appointments.
                Super admins can return here to turn maintenance mode off.
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
             This will apply immediately after confirmation.
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t bg-slate-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => setIsMaintenanceConfirmOpen(false)}
            >
              Cancel
            </Button>

            <Button type="button" className="cursor-pointer" onClick={handleConfirmMaintenance}>
              Turn on
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <DialogContent className="!max-w-lg overflow-hidden p-0">
          <div className="border-b bg-red-50 px-6 py-5">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700">
                  <RotateCcw className="size-5" />
                </div>

                <div>
                  <DialogTitle>Reset settings draft to default?</DialogTitle>
                  <DialogDescription className="mt-2 leading-6">
                    This resets the form values to OfficeFlow defaults. The backend will not change
                    until you click Save.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex justify-end gap-2 border-t bg-slate-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => setIsResetConfirmOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              onClick={handleConfirmReset}
            >
              Reset draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function LiveClock({ timezone }: { timezone: string }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const formatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium',
        timeZone: timezone,
      }).format(now)
    } catch {
      return 'Unknown timezone'
    }
  }, [now, timezone])

  return <p className="mt-1 text-sm leading-6 text-muted-foreground">{formatted}</p>
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="flex select-none items-start gap-3 border-b bg-slate-50 px-5 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-white text-slate-700">
          <Icon className="size-5" />
        </div>

        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="space-y-4 p-5">{children}</div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

function SettingSelect({
  id,
  value,
  options,
  onChange,
}: {
  id: string
  value: string
  options: { label: string; value: string }[]
  onChange: (value: string) => void
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function TimezoneSelect({
  id,
  value,
  options,
  onChange,
}: {
  id: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  const [query, setQuery] = useState(value)
  const validTimezones = useMemo(() => new Set(options), [options])

  useEffect(() => {
    setQuery(value)
  }, [value])

  function handleChange(next: string) {
    setQuery(next)

    if (validTimezones.has(next)) {
      onChange(next)
    }
  }

  const isInvalid = query !== value && !validTimezones.has(query)

  return (
    <div className="space-y-1">
      <input
        id={id}
        list={`${id}-options`}
        value={query}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Search timezone, e.g. Manila"
        className={cn(
          'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors focus:ring-3',
          isInvalid
            ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
            : 'border-input focus:border-ring focus:ring-ring/50'
        )}
      />

      <datalist id={`${id}-options`}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>

      {isInvalid ? (
        <p className="text-xs text-red-600">Pick a timezone from the list to apply it.</p>
      ) : null}
    </div>
  )
}

function ControlRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-white p-4">
      <div className="min-w-0 select-none">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <OffOnToggle checked={checked} onChange={onChange} compact />
    </div>
  )
}

function OffOnToggle({
  checked,
  onChange,
  compact = false,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  compact?: boolean
}) {
  return (
    <div
      role="group"
      className={cn(
        'grid shrink-0 grid-cols-2 rounded-lg border bg-slate-100 p-1',
        compact ? 'w-28' : 'w-36'
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={!checked}
        onClick={() => onChange(false)}
        className={cn(
          'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
          !checked ? 'bg-white text-slate-950 shadow-sm' : 'text-muted-foreground hover:text-slate-950'
        )}
      >
        Off
      </button>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(true)}
        className={cn(
          'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
          checked ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-slate-950'
        )}
      >
        On
      </button>
    </div>
  )
}

function PolicyRow({
  icon: Icon,
  label,
  value,
  enforced = false,
}: {
  icon: LucideIcon
  label: string
  value: string
  enforced?: boolean
}) {
  return (
    <div className="flex select-none items-center gap-3 rounded-lg border bg-slate-50 px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate text-sm text-muted-foreground">{value}</p>
      </div>

      {enforced ? (
        <Badge variant="secondary" className="shrink-0 border-0 bg-slate-200 text-slate-600">
          Enforced
        </Badge>
      ) : null}
    </div>
  )
}