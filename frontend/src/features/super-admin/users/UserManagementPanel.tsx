import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { getApiErrorMessage } from '@/features/auth/auth-api'
import {
  getManagedUsers,
  updateManagedUserRole,
  type ManagedUser,
  type ManagedUserRole,
  type ManagedUsersMeta,
} from '@/features/super-admin/super-admin-api'
import { getStoredUser } from '@/lib/auth-storage'
import { cn } from '@/lib/utils'

const emptyUsersMeta: ManagedUsersMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
}

const confirmPhrase = 'CHANGE ROLE'

const roleOptions: Array<{ value: ManagedUserRole | 'all'; label: string }> = [
  { value: 'all', label: 'All roles' },
  { value: 'user', label: 'Users' },
  { value: 'staff', label: 'Staff' },
  { value: 'super_admin', label: 'Super admins' },
]

const editableRoleOptions = [
  {
    value: 'user',
    label: 'User',
    description: 'Can create tickets, book appointments, and view their own request history.',
  },
  {
    value: 'staff',
    label: 'Staff',
    description: 'Can start shifts, claim requests, update statuses, and reply to users.',
  },
  {
    value: 'super_admin',
    label: 'Super Admin',
    description: 'Can manage users, staff workload, queues, audit logs, and analytics.',
  },
] satisfies Array<{
  value: ManagedUserRole
  label: string
  description: string
}>

const roleStyles: Record<ManagedUserRole, string> = {
  user: 'bg-sky-100 text-sky-700',
  staff: 'bg-emerald-100 text-emerald-700',
  super_admin: 'bg-violet-100 text-violet-700',
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

function formatRole(role: ManagedUserRole) {
  if (role === 'super_admin') return 'Super Admin'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function UserManagementPanel() {
  const currentUser = getStoredUser()
  const hasLoadedUsers = useRef(false)
  const latestRequestId = useRef(0)

  const [users, setUsers] = useState<ManagedUser[]>([])
  const [meta, setMeta] = useState<ManagedUsersMeta>(emptyUsersMeta)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<ManagedUserRole | 'all'>('all')
  const [page, setPage] = useState(1)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null)
  const [selectedRole, setSelectedRole] = useState<ManagedUserRole>('user')
  const [isConfirmingRoleChange, setIsConfirmingRoleChange] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [error, setError] = useState('')

  const canConfirmRoleChange =
    selectedUser !== null &&
    selectedUser.role !== selectedRole &&
    confirmationText.trim().toUpperCase() === confirmPhrase

  const loadUsers = useCallback(async () => {
    const requestId = latestRequestId.current + 1
    latestRequestId.current = requestId

    if (!hasLoadedUsers.current) setIsInitialLoading(true)

    try {
      const response = await getManagedUsers({
        search: search.trim() || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        page,
        per_page: 10,
      })

      if (requestId !== latestRequestId.current) return

      setUsers(response.data)
      setMeta(response.meta)
      setError('')
    } catch (error) {
      if (requestId !== latestRequestId.current) return
      setError(getApiErrorMessage(error, 'Unable to load users.'))
    } finally {
      if (requestId === latestRequestId.current) {
        hasLoadedUsers.current = true
        setIsInitialLoading(false)
      }
    }
  }, [page, roleFilter, search])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleRoleFilterChange(role: ManagedUserRole | 'all') {
    setRoleFilter(role)
    setPage(1)
  }

  function openRoleDialog(user: ManagedUser) {
    setSelectedUser(user)
    setSelectedRole(user.role)
    setIsConfirmingRoleChange(false)
    setConfirmationText('')
  }

  function closeRoleDialog() {
    if (updatingUserId) return

    setSelectedUser(null)
    setIsConfirmingRoleChange(false)
    setConfirmationText('')
  }

  async function handleRoleUpdate() {
    if (!selectedUser || !canConfirmRoleChange) return

    setUpdatingUserId(selectedUser.id)
    setError('')

    try {
      const response = await updateManagedUserRole(selectedUser.id, selectedRole)

      setUsers((current) =>
        current.map((user) => (user.id === selectedUser.id ? response.data : user))
      )

      closeRoleDialog()
      await loadUsers()
    } catch (error) {
      setError(getApiErrorMessage(error, 'Unable to update user role.'))
    } finally {
      setUpdatingUserId(null)
    }
  }

  return (
    <section className="mx-auto max-w-7xl">
      {error ? (
        <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="grid gap-4 border-b bg-slate-50 px-5 py-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">User management</h2>
              <p className="text-sm text-muted-foreground">
                Manage visitors, staff accounts, and super admin access.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleFilterChange(role.value)}
                  className={cn(
                    'cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                    roleFilter === role.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-white text-muted-foreground hover:bg-slate-50 hover:text-foreground'
                  )}
                >
                  {role.label}
                </button>
              ))}
            </div>

            <div className="relative w-full xl:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search users..."
                className="bg-white pl-9"
              />
            </div>
          </div>
        </div>

        <div className="hidden grid-cols-[minmax(420px,1fr)_180px_190px] border-b bg-slate-50 px-5 py-3 text-xs font-semibold uppercase text-muted-foreground lg:grid">
          <span>Account</span>
          <span className="text-center">Role</span>
          <span className="text-center">Access</span>
        </div>

        {isInitialLoading ? (
          <div className="px-5 py-8 text-sm text-muted-foreground">Loading users...</div>
        ) : users.length ? (
          users.map((user) => (
            <article
              key={user.id}
              className="grid gap-4 border-b px-5 py-4 last:border-b-0 hover:bg-slate-50 lg:grid-cols-[minmax(420px,1fr)_180px_190px] lg:items-center"
            >
              <div className="flex min-w-0 gap-3">
                <Avatar className="size-11">
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="lg:flex lg:justify-end">
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground lg:hidden">
                  Role
                </p>

                <Badge
                  variant="secondary"
                  className={cn(
                    'inline-flex h-7 w-36 justify-center border-0 text-center',
                    roleStyles[user.role]
                  )}
                >
                  {formatRole(user.role)}
                </Badge>
              </div>

              <div className="flex justify-start lg:justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="w-36 cursor-pointer gap-2 bg-white"
                  disabled={updatingUserId === user.id || user.id === currentUser?.id}
                  onClick={() => openRoleDialog(user)}
                >
                  <UserCog className="size-4" />
                  {user.id === currentUser?.id ? 'Your account' : 'Manage role'}
                </Button>
              </div>
            </article>
          ))
        ) : (
          <div className="grid min-h-56 place-items-center px-5 py-12 text-center">
            <div>
              <Users className="mx-auto size-9 text-muted-foreground" />
              <h3 className="mt-3 font-semibold">No users found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different search term or role filter.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.last_page} - {meta.total} users
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer bg-white"
              disabled={meta.current_page <= 1}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer bg-white"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage((current) => Math.min(current + 1, meta.last_page))}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={Boolean(selectedUser)} onOpenChange={closeRoleDialog}>
        <DialogContent className="!max-w-xl overflow-hidden p-0">
          <div className="border-b bg-slate-50 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="size-5" />
                {isConfirmingRoleChange ? 'Review access change' : 'Manage user role'}
              </DialogTitle>
              <DialogDescription>
                {isConfirmingRoleChange
                  ? 'Confirm the final access update before it is applied.'
                  : 'Choose the correct role for this OfficeFlow account.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedUser ? (
            <div className="space-y-5 px-6 py-5">
              <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
                <Avatar className="size-9">
                  <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              {!isConfirmingRoleChange ? (
                <>
                  <div className="grid gap-3">
                    {editableRoleOptions.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setSelectedRole(role.value)}
                        className={cn(
                          'cursor-pointer rounded-lg border p-4 text-left transition-colors',
                          selectedRole === role.value
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
                            : 'bg-white hover:bg-slate-50'
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{role.label}</p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {role.description}
                            </p>
                          </div>

                          <Badge
                            variant="secondary"
                            className={cn(
                              'w-32 shrink-0 justify-center border-0',
                              roleStyles[role.value]
                            )}
                          >
                            {formatRole(role.value)}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedRole === 'super_admin' ? (
                    <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                      <ShieldAlert className="mt-0.5 size-5 shrink-0" />
                      <p className="text-sm leading-6">
                        Super admin has full system access. Only trusted system owners should
                        receive this role.
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={closeRoleDialog}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="button"
                      className="cursor-pointer"
                      disabled={selectedRole === selectedUser.role}
                      onClick={() => setIsConfirmingRoleChange(true)}
                    >
                      Review change
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                        <LockKeyhole className="size-5" />
                      </div>

                      <div>
                        <p className="font-semibold">Access review</p>
                        <p className="text-sm text-muted-foreground">
                          This change will update the user&apos;s permissions immediately.
                        </p>
                      </div>
                    </div>

                    <div className="mx-auto grid max-w-lg items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                     <div className="rounded-lg border bg-white p-4 text-center">
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          Current role
                        </p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'mx-auto mt-3 w-36 justify-center border-0',
                            roleStyles[selectedUser.role]
                          )}
                        >
                          {formatRole(selectedUser.role)}
                        </Badge>
                      </div>

                      <div className="hidden size-9 items-center justify-center rounded-full border bg-white text-muted-foreground sm:flex">
                        <ArrowRight className="size-4" />
                      </div>

                    <div className="rounded-lg border bg-white p-4 text-center">
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          New role
                        </p>
                        <Badge
                          variant="secondary"
                          className={cn('mx-auto mt-3 w-36 justify-center border-0', roleStyles[selectedRole])}
                        >
                          {formatRole(selectedRole)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                    <div className="flex gap-3">
                      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
                      <div>
                        <p className="font-medium text-amber-900">Confirmation required</p>
                        <p className="mt-1 text-sm leading-6 text-amber-800">
                          Type <span className="font-semibold">{confirmPhrase}</span> to apply this
                          access change.
                        </p>
                      </div>
                    </div>

                    <Input
                      value={confirmationText}
                      onChange={(event) => setConfirmationText(event.target.value)}
                      placeholder={confirmPhrase}
                      className="mt-4 bg-white"
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                      disabled={Boolean(updatingUserId)}
                      onClick={() => {
                        setIsConfirmingRoleChange(false)
                        setConfirmationText('')
                      }}
                    >
                      Back
                    </Button>

                    <Button
                      type="button"
                      className="cursor-pointer"
                      disabled={Boolean(updatingUserId) || !canConfirmRoleChange}
                      onClick={handleRoleUpdate}
                    >
                      {updatingUserId ? 'Updating...' : 'Apply changes'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}