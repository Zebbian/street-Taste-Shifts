import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../features/auth/AuthContext'

export function AppLayout() {
  const { user, signOut } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
    }`

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-6 sm:justify-start">
            <span className="text-base font-semibold text-neutral-900">Street Taste</span>
            <button
              onClick={signOut}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 sm:hidden"
            >
              Sign out
            </button>
          </div>
          <nav className="-mx-1 flex gap-1 overflow-x-auto">
            <NavLink to="/schedule" className={linkClass}>
              Schedule
            </NavLink>
            {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
              <>
                <NavLink to="/staff" className={linkClass}>
                  Staff
                </NavLink>
                <NavLink to="/dashboard" className={linkClass}>
                  Dashboard
                </NavLink>
              </>
            )}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-sm text-neutral-500">{user?.fullName}</span>
            <button
              onClick={signOut}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4">
        <Outlet />
      </main>
    </div>
  )
}
