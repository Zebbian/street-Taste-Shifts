import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import type { Position, User } from '../../types/api'

export interface RegisterStaffInput {
  email: string
  fullName: string
  position: Position
  hourlyRateCents: number
}

export interface RegisterManagerInput {
  email: string
  fullName: string
}

export interface UpdateStaffInput {
  fullName?: string
  position?: Position
  hourlyRateCents?: number | null
  sundayRateCents?: number | null
  active?: boolean
  role?: 'MANAGER' | 'STAFF'
}

export function useStaffList() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get<{ users: User[] }>('/api/users'),
    select: (data) => data.users,
  })
}

export function useRegisterStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RegisterStaffInput) => apiClient.post<{ user: User }>('/api/users/register-staff', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useRegisterManager() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RegisterManagerInput) => apiClient.post<{ user: User }>('/api/users/register-manager', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStaffInput }) =>
      apiClient.patch<{ user: User }>(`/api/users/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
