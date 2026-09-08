import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import { weekStartInstant } from '../../lib/week'
import type { PayrollEntry } from '../../types/api'

export function usePayroll(week: string) {
  return useQuery({
    queryKey: ['payroll', week],
    queryFn: () =>
      apiClient.get<{ week: string; payroll: PayrollEntry[] }>(
        `/api/dashboard/payroll?week=${week}&weekStart=${encodeURIComponent(weekStartInstant(week))}`
      ),
  })
}
