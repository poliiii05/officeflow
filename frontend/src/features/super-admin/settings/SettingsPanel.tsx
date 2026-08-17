import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Database,
  Info,
  Loader2,
  Lock,
  Power,
  RotateCcw,
  Save,
  TicketCheck,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

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
import {
  getSuperAdminSettings,
  updateSuperAdminSettings,
  type SystemSettings,
} from '@/features/super-admin/settings/settings-api'
import { cn } from '@/lib/utils'

// NOTE ON SCOPE: this page now only holds settings that are genuinely
// system-wide (apply to the whole workspace, not to one ticket/appointment
// at a time). `default_ticket_priority` and `appointment_lead_days` used to
// live here but were removed - those are resource-level configuration
// (belong with ticket categories/priorities and appointment services once
// that Configuration page exists), not system behavior. They're still part
// of SystemSettings below so saving this form doesn't wipe them, they're
// just no longer edited from this screen.

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
  // New - requires adding these two fields to the SystemSettings type in
  // settings-api.ts. See the chat message for the exact type addition.
  requester_access: 'open',
  session_timeout_minutes: 60,
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
  const fieldsDisabled = isLoading || isSaving

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
    if (value === settings.maintenance_mode) return

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
      <section className="mx-auto max-w-7xl space-y-5 pb-28">
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
            <div className="flex items-start gap-4">
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
                  Control requester access during deployments, emergency fixes, or controlled
                  maintenance windows.
                </p>
              </div>
            </div>

            <OffOnToggle
              checked={settings.maintenance_mode}
              onChange={handleMaintenanceChange}
              disabled={isSaving}
            />
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
                  ? 'Normal requesters are redirected to the maintenance screen. Staff and super admins can continue operational work.'
                  : 'OfficeFlow is available. Requesters can submit tickets, book appointments, and view updates.'}
              </p>
            </div>
          </div>
        </section>

        {savedAt ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" />
            Settings saved at {savedAt}.
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-5">
            <SettingsSection
              icon={Building2}
              title="Workspace profile"
              description="Workspace name, support contact, public note, and timezone."
              isLoading={isLoading}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Office name"
                  htmlFor="officeName"
                  hint='The specific office or organization using OfficeFlow (e.g. "Acme Corp - IT Support Desk"). Shown on notifications and reports, not the product name in the sidebar.'
                >
                  <Input
                    id="officeName"
                    value={settings.office_name}
                    disabled={fieldsDisabled}
                    onChange={(event) => updateSetting('office_name', event.target.value)}
                  />
                </Field>

                <Field
                  label="Public contact email"
                  htmlFor="supportEmail"
                  hint="Shown to requesters as the reply-to/contact address. Display value only - the account that actually sends email (SMTP) is configured on the server, not here."
                >
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.support_email}
                    disabled={fieldsDisabled}
                    onChange={(event) => updateSetting('support_email', event.target.value)}
                  />
                </Field>

                <Field label="System timezone" htmlFor="timezone">
                  <TimezoneSelect
                    id="timezone"
                    value={settings.timezone}
                    options={timezones}
                    disabled={fieldsDisabled}
                    onChange={(value) => updateSetting('timezone', value)}
                  />
                </Field>

                <div className="rounded-lg border bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium">Current system time</p>
                  <LiveClock timezone={settings.timezone} />
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              icon={TicketCheck}
              title="Request policy"
              description="Cross-cutting rules that apply to both tickets and appointments."
              isLoading={isLoading}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <ControlRow
                  title="Requester cancellation"
                  description="Allow requesters to cancel eligible requests before staff handling."
                  checked={settings.allow_user_cancellation}
                  disabled={fieldsDisabled}
                  onChange={(value) => updateBooleanSetting('allow_user_cancellation', value)}
                />

                <ControlRow
                  title="Require staff shift"
                  description="Only on-duty staff can claim queue items or change statuses."
                  checked={settings.staff_shift_required}
                  disabled={fieldsDisabled}
                  onChange={(value) => updateBooleanSetting('staff_shift_required', value)}
                />

                <Field label="Cancellation window" htmlFor="cancellationWindow">
                  <SettingSelect
                    id="cancellationWindow"
                    value={settings.cancellation_window}
                    disabled={fieldsDisabled}
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
              </div>
            </SettingsSection>
          </div>

          <div className="space-y-5">
            <SettingsSection
              icon={Lock}
              title="Access control"
              description="Who can reach OfficeFlow, and how long a session stays signed in."
              isLoading={isLoading}
            >
              <Field
                label="How requester accounts get created"
                htmlFor="requesterAccess"
                hint="Controls how new requester accounts come to exist. A signed-in account is always required to submit a ticket or book an appointment - this only changes how that account gets created. Anyone can self-register: instant access, no approval. Self-register + email verification: must confirm their email before signing in. Staff-created accounts only: public sign-up is off, staff or a super admin creates the account."
              >
                <SettingSelect
                  id="requesterAccess"
                  value={settings.requester_access}
                  disabled={fieldsDisabled}
                  onChange={(value) =>
                    updateSetting('requester_access', value as SystemSettings['requester_access'])
                  }
                  options={[
                    { label: 'Anyone can self-register', value: 'open' },
                    { label: 'Self-register + email verification', value: 'registration_required' },
                    { label: 'Staff-created accounts only', value: 'restricted' },
                  ]}
                />
              </Field>

              <Field
                label="Staff & admin session timeout"
                htmlFor="sessionTimeout"
                hint="Staff and super admins are signed out after this much time without activity."
              >
                <SettingSelect
                  id="sessionTimeout"
                  value={String(settings.session_timeout_minutes)}
                  disabled={fieldsDisabled}
                  onChange={(value) => updateSetting('session_timeout_minutes', Number(value))}
                  options={[
                    { label: '30 minutes', value: '30' },
                    { label: '1 hour', value: '60' },
                    { label: '4 hours', value: '240' },
                    { label: '8 hours', value: '480' },
                  ]}
                />
              </Field>
            </SettingsSection>

            <SettingsSection
              icon={Database}
              title="Audit & data retention"
              description="How long OfficeFlow keeps a record of system activity."
              isLoading={isLoading}
            >
              <Field
                label="Audit log retention"
                htmlFor="auditLogRetention"
                hint="Entries older than the selected window are removed from Audit Logs. Ticket and appointment records themselves are kept indefinitely for service history."
              >
                <SettingSelect
                  id="auditLogRetention"
                  value={settings.audit_log_retention}
                  disabled={fieldsDisabled}
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
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                Takes effect only once a scheduled backend cleanup job reads this value - confirm
                that job exists before relying on it in production.
              </p>
            </SettingsSection>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">System settings</p>
              {isLoading ? (
                <Badge variant="secondary" className="gap-1 border-0 bg-slate-100 text-slate-600">
                  <Loader2 className="size-3 animate-spin" />
                  Loading
                </Badge>
              ) : hasUnsavedChanges ? (
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
              Save applies these rules through the OfficeFlow settings API.
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
              onClick={() => void saveSettings(settings)}
              disabled={isLoading || isSaving || !hasUnsavedChanges}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={isMaintenanceConfirmOpen} onOpenChange={setIsMaintenanceConfirmOpen}>
        <DialogContent className="!max-w-lg overflow-hidden p-0">
          <div className="border-b bg-amber-50 px-5 py-4">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700">
                  <AlertTriangle className="size-5" />
                </div>

                <div>
                  <DialogTitle>Turn on maintenance mode?</DialogTitle>
                  <DialogDescription className="mt-2 leading-6">
                    Normal requesters will be redirected to the maintenance screen.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="space-y-3 px-5 py-4">
            <div className="rounded-lg border bg-white p-4 text-sm leading-6 text-muted-foreground">
              Staff and super admins can continue using operational dashboards while requester
              access is paused.
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              Only turn this on during updates, emergency fixes, or controlled testing.
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t bg-slate-50 px-5 py-4">
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
        <DialogContent className="!max-w-md overflow-hidden p-0">
          <div className="border-b bg-red-50 px-5 py-4">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700">
                  <RotateCcw className="size-5" />
                </div>

                <div>
                  <DialogTitle>Reset settings draft?</DialogTitle>
                  <DialogDescription className="mt-2 leading-6">
                    This resets the form to defaults. Nothing changes in the backend until you save.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex justify-end gap-2 border-t bg-slate-50 px-5 py-4">
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
  isLoading = false,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  isLoading?: boolean
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b bg-slate-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-white text-slate-700">
            <Icon className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {isLoading ? <Loader2 className="mt-1 size-4 shrink-0 animate-spin text-muted-foreground" /> : null}
      </div>

      <div className={cn('space-y-4 p-5', isLoading && 'opacity-60')}>{children}</div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint ? <FieldHint text={hint} /> : null}
      </div>
      {children}
    </div>
  )
}

// Renders via a portal into document.body instead of inline. The section
// cards use `overflow-hidden` for their rounded corners, which was clipping
// this tooltip whenever it popped up near a card edge. A portal escapes that
// clipping entirely, and we flip to showing below the icon when there isn't
// enough room above it in the viewport.
function FieldHint({ text }: { text: string }) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top')
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  function reposition() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return

    const estimatedTooltipHeight = 110
    const nextPlacement: 'top' | 'bottom' =
      rect.top > estimatedTooltipHeight + 12 ? 'top' : 'bottom'

    setPlacement(nextPlacement)
    setCoords({
      top: nextPlacement === 'top' ? rect.top - 10 : rect.bottom + 10,
      left: Math.min(Math.max(rect.left + rect.width / 2, 140), window.innerWidth - 140),
    })
  }

  function show() {
    reposition()
    setOpen(true)
  }

  function hide() {
    setOpen(false)
  }

  return (
    <span className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => (open ? hide() : show())}
        aria-label={text}
        aria-expanded={open}
        className="inline-flex size-4 shrink-0 cursor-help items-center justify-center rounded-full text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Info className="size-3.5" />
      </button>

      {open
        ? createPortal(
            <span
              role="tooltip"
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                transform: placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
              }}
              className="z-50 w-64 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs leading-5 text-slate-700 shadow-lg"
            >
              {text}
              <span
                className={cn(
                  'absolute left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-[2px] border-slate-200 bg-white',
                  placement === 'top'
                    ? 'top-full -mt-[7px] border-b border-r'
                    : 'bottom-full -mb-[7px] border-l border-t'
                )}
              />
            </span>,
            document.body
          )
        : null}
    </span>
  )
}

function SettingSelect({
  id,
  value,
  options,
  disabled = false,
  onChange,
}: {
  id: string
  value: string
  options: { label: string; value: string }[]
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
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
  disabled = false,
  onChange,
}: {
  id: string
  value: string
  options: string[]
  disabled?: boolean
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
        disabled={disabled}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Search timezone, e.g. Asia/Manila"
        className={cn(
          'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors focus:ring-3 disabled:cursor-not-allowed disabled:opacity-60',
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
  disabled = false,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-white p-4">
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <OffOnToggle checked={checked} onChange={onChange} disabled={disabled} compact />
    </div>
  )
}

function OffOnToggle({
  checked,
  onChange,
  disabled = false,
  compact = false,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  compact?: boolean
}) {
  return (
    <div
      role="group"
      className={cn(
        'grid shrink-0 grid-cols-2 rounded-lg border bg-slate-100 p-1',
        disabled && 'opacity-60',
        compact ? 'w-28' : 'w-36'
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={!checked}
        disabled={disabled}
        onClick={() => onChange(false)}
        className={cn(
          'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed',
          !checked ? 'bg-white text-slate-950 shadow-sm' : 'text-muted-foreground hover:text-slate-950'
        )}
      >
        Off
      </button>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(true)}
        className={cn(
          'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed',
          checked ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-slate-950'
        )}
      >
        On
      </button>
    </div>
  )
}