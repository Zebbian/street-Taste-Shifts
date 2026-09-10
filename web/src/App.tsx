import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './features/auth/AuthContext'
import { LoginPage } from './features/auth/LoginPage'
import { AcceptInvitePage } from './features/auth/AcceptInvitePage'
import { AppLayout } from './components/AppLayout'
import { RequireAuth } from './components/RequireAuth'
import { SchedulePage } from './features/schedule/SchedulePage'
import { StaffPage } from './features/staff/StaffPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { MyDashboardPage } from './features/dashboard/MyDashboardPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />

            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/my-earnings" element={<MyDashboardPage />} />

                <Route element={<RequireAuth roles={['ADMIN', 'MANAGER']} />}>
                  <Route path="/staff" element={<StaffPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/schedule" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
