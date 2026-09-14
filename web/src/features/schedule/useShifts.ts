import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import { weekStartInstant } from '../../lib/week'
import type { Position, Shift } from '../../types/api'

export interface CreateShiftInput {
  staffId: string
  startsAt: string
  endsAt: string
  localDate: string
  position: Position
  notes?: string
}

export type UpdateShiftInput = Partial<CreateShiftInput>

export function useShifts(week: string) {
  return useQuery({
    queryKey: ['shifts', week],
    queryFn: () =>
      apiClient.get<{ shifts: Shift[] }>(
        `/api/shifts?week=${week}&weekStart=${encodeURIComponent(weekStartInstant(week))}`
      ),
    select: (data) => data.shifts,
  })
}

export function useCreateShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateShiftInput) => apiClient.post<{ shift: Shift }>('/api/shifts', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
  })
}

export function useUpdateShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateShiftInput }) =>
      apiClient.patch<{ shift: Shift }>(`/api/shifts/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
  })
}

export function useDeleteShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/shifts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
  })
}

export function useRefreshShiftRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, localDate }: { id: string; localDate: string }) =>
      apiClient.post<{ shift: Shift }>(`/api/shifts/${id}/refresh-rate`, { localDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['my-earnings'] })
    },
  })
}
