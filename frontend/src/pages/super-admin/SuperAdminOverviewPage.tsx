import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

import { SuperAdminOverviewPanel } from '@/features/super-admin/overview/SuperAdminOverviewPanel'
import { SuperAdminLayout } from '@/layouts/SuperAdminLayout'
import { cn } from '@/lib/utils'

export function SuperAdminOverviewPage() {
  const [isOverviewRefreshing, setIsOverviewRefreshing] = useState(false)

  return (
    <SuperAdminLayout
      title="Monitor staff and service load"
      description="Track queue pressure, staff availability, and workload distribution."
      badge="Super admin operations"
      actions={
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs text-muted-foreground shadow-sm">
          <RefreshCw className={cn('size-3.5', isOverviewRefreshing && 'animate-spin')} />
          Live sync
        </div>
      }
    >
      <SuperAdminOverviewPanel onRefreshingChange={setIsOverviewRefreshing} />
    </SuperAdminLayout>
  )
}