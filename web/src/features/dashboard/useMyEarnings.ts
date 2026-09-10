import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import { monthStartInstant, startOfMonthIso, startOfWeekIso, todayStartInstant, weekStartInstant } from '../../lib/week'
import type { MyEarningsResponse } from '../../types/api'

export function useMyEarnings() {
  const weekAnchor = startOfWeekIso()
  const monthDate = startOfMonthIso()

  const params = new URLSearchParams({
    dayStart: todayStartInstant(),
    weekAnchor,
    weekStart: weekStartInstant(weekAnchor),
    monthDate,
    monthStart: monthStartInstant(monthDate),
  })

  return useQuery({
    queryKey: ['my-earnings', weekAnchor, monthDate],
    queryFn: () => apiClient.get<MyEarningsResponse>(`/api/dashboard/me?${params.toString()}`),
  })
}
