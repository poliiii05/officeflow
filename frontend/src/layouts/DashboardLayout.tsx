import {
  BarChart3,
  Bell,
  CalendarCheck,
  ClipboardList,
  FileClock,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  TicketCheck,
  UserCog,
  Users,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { logoutUser } from '@/features/auth/auth-api'
import { getStoredUser, type AuthUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

type DashboardLayoutProps = {
  children: ReactNode
  title: string
  description?: string
  badge?: string
  actions?: ReactNode
}

type NavItem = {
  label: string
  to: string
  icon: typeof LayoutDashboard
}

function getInitials(name?: string) {
  if (!name) return 'OF'

  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getWorkspaceLabel(user: AuthUser | null) {
  if (!user) return 'Workspace'

  if (user.role === 'super_admin') return 'Super admin workspace'
  if (user.role === 'staff') return 'Staff workspace'

  return 'Requester workspace'
}

function getRoleBadge(user: AuthUser | null) {
  if (!user) return 'Account'

  if (user.role === 'super_admin') return 'Super Admin'
  if (user.role === 'staff') return 'Staff'

  return 'Requester'
}

function getNavItems(user: AuthUser | null): NavItem[] {
  if (!user) return []

    if (user.role === 'super_admin') {
    return [
      { label: 'Overview', to: '/super-admin/dashboard', icon: LayoutDashboard },
      { label: 'Users', to: '/super-admin/users', icon: UserCog },
      { label: 'Staff', to: '/super-admin/staff', icon: Users },
      { label: 'Queue Monitor', to: '/super-admin/queue', icon: ClipboardList },
      { label: 'Audit Logs', to: '/super-admin/audit-logs', icon: History },
      { label: 'Analytics', to: '/super-admin/analytics', icon: BarChart3 },
      { label: 'System Settings', to: '/super-admin/settings', icon: Settings },
      { label: 'Account Settings', to: '/super-admin/account-settings', icon: UserCog },
    ]
  }

  if (user.role === 'staff') {
    return [
      { label: 'Dashboard', to: '/staff/dashboard', icon: LayoutDashboard },
      { label: 'Queue', to: '/staff/queue', icon: ClipboardList },
      { label: 'My Work', to: '/staff/work', icon: TicketCheck },
      { label: 'Records', to: '/staff/records', icon: FileClock },
      { label: 'Shift History', to: '/staff/shifts', icon: History },
      { label: 'Settings', to: '/staff/settings', icon: Settings },
    ]
  }

    return [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'My Requests', to: '/tickets', icon: TicketCheck },
    { label: 'Appointments', to: '/appointments', icon: CalendarCheck },
    { label: 'Notifications', to: '/notifications', icon: Bell },
    { label: 'Settings', to: '/settings', icon: Settings },
  ]
}

export function DashboardLayout({
  children,
  title,
  description,
  badge,
  actions,
}: DashboardLayoutProps) {
  const navigate = useNavigate()
  const user = getStoredUser()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const navItems = useMemo(() => getNavItems(user), [user])
  const badgeLabel = badge ?? getRoleBadge(user)

  async function handleLogout() {
    await logoutUser()
    navigate('/', { replace: true })
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r bg-white">
      <div className="flex h-20 items-center gap-3 border-b px-5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ClipboardList className="size-5" />
        </div>
        <div>
          <p className="font-semibold">OfficeFlow</p>
          <p className="text-sm text-muted-foreground">{getWorkspaceLabel(user)}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <Icon className="size-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg border bg-slate-50 p-3">
          <Avatar className="size-9">
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name ?? 'OfficeFlow User'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? 'No email'}</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full cursor-pointer justify-start gap-2 bg-white"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </aside>
  )

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f4f7fb_54%,#f8fbf6_100%)] text-slate-950">
      <div className="hidden fixed inset-y-0 left-0 z-30 lg:block">{sidebar}</div>

      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="cursor-pointer lg:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="size-4" />
              </Button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                    {badgeLabel}
                  </span>
                  {user?.role === 'super_admin' ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                      <ShieldCheck className="size-3" />
                      Full access
                    </span>
                  ) : null}
                </div>
                <h1 className="mt-2 truncate text-xl font-semibold sm:text-2xl">{title}</h1>
                {description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {actions}
            </div>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6">
          {children}
        </div>
      </div>
    </main>
  )
}