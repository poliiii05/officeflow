import type { ReactNode } from 'react'

import { DashboardLayout } from '@/layouts/DashboardLayout'

type SuperAdminLayoutProps = {
  children: ReactNode
  title: string
  description?: string
  badge?: string
  actions?: ReactNode
}

export function SuperAdminLayout({
  children,
  title,
  description,
  badge,
  actions,
}: SuperAdminLayoutProps) {
  return (
    <DashboardLayout title={title} description={description} badge={badge} actions={actions}>
      {children}
    </DashboardLayout>
  )
}