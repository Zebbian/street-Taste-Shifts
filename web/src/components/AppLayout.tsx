import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../features/auth/AuthContext'

export function AppLayout() {
  const { user, signOut } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-brand-600 text-white' : 'text-neutral-300 hover:bg-white/10 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b-2 border-gold-400 bg-ink-900">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-6 sm:justify-start">
            <span className="flex items-center gap-2 text-base font-semibold text-white">
              <span className="inline-block h-2 w-2 rounded-full bg-gold-400" aria-hidden="true" />
              Street Taste
            </span>
            <button
              onClick={signOut}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-300 hover:bg-white/10 hover:text-white sm:hidden"
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
            <span className="text-sm text-neutral-300">{user?.fullName}</span>
            <button
              onClick={signOut}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-300 hover:bg-white/10 hover:text-white"
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
