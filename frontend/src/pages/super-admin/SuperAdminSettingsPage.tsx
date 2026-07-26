import { Settings } from 'lucide-react'

import { SettingsPanel } from '@/features/super-admin/settings/SettingsPanel'
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'

export function SuperAdminSettingsPage() {
  return (
    <SuperAdminLayout
      title="System settings"
      description="Review system rules, security controls, notifications, and data behavior."
      badge="System controls"
      actions={
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs text-muted-foreground shadow-sm">
          <Settings className="size-3.5" />
          Admin settings
        </div>
      }
    >
      <SettingsPanel />
    </SuperAdminLayout>
  )
}