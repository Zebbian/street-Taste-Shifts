import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import { payPeriodStartInstant } from '../../lib/week'
import type { PayrollResponse } from '../../types/api'

export function usePayroll(periodStart: string) {
  return useQuery({
    queryKey: ['payroll', periodStart],
    queryFn: () =>
      apiClient.get<PayrollResponse>(
        `/api/dashboard/payroll?periodDate=${periodStart}&periodDateInstant=${encodeURIComponent(payPeriodStartInstant(periodStart))}`
      ),
  })
}
