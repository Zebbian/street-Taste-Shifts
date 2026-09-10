export type Role = 'ADMIN' | 'MANAGER' | 'STAFF'

export type Position = 'HOST' | 'WAITRESS' | 'BARTENDER' | 'RUNNER' | 'MANAGER'

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  position: Position
  hourlyRateCents: number | null
  sundayRateCents: number | null
  active: boolean
  inviteSentAt: string | null
  createdAt: string
}

export interface ShiftStaffSummary {
  id: string
  fullName: string
  position: Position
}

export interface Shift {
  id: string
  staffId: string
  staff: ShiftStaffSummary
  startsAt: string
  endsAt: string
  position: Position
  hourlyRateCentsSnapshot: number
  notes: string | null
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface PayrollEntry {
  staffId: string
  fullName: string
  position: Position
  totalMinutes: number
  totalCents: number
  shiftCount: number
  totalHours: number
}

export interface PayrollResponse {
  periodStart: string
  periodEnd: string
  payroll: PayrollEntry[]
}

export interface ShiftTotals {
  totalMinutes: number
  totalCents: number
  totalHours: number
  shiftCount: number
}

export interface MyEarningsResponse {
  today: ShiftTotals
  thisWeek: ShiftTotals
  thisMonth: ShiftTotals
}

export interface ApiErrorBody {
  error: { code: string; message: string }
}
