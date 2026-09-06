import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../features/auth/AuthContext'
import type { Role } from '../types/api'

export function RequireAuth({ role }: { role?: Role }) {
  const { session, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">Loading…</div>
    )
  }

  if (!session || !user) {
    return <Navigate to="/login" replace />
  }

  if (role && user.role !== role) {
    return <Navigate to="/schedule" replace />
  }

  return <Outlet />
}
