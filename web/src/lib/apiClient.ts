import { getSession, signOut } from './supabaseAuth'
import type { ApiErrorBody } from '../types/api'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('Missing VITE_API_URL')
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await getSession()

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...init?.headers,
    },
  })

  if (res.status === 401) {
    // Session expired or invalid — force a clean re-login rather than
    // leaving the app in an inconsistent authenticated-looking state.
    await signOut()
    throw new ApiError(401, 'UNAUTHORIZED', 'Your session has expired. Please sign in again.')
  }

  if (res.status === 204) {
    return undefined as T
  }

  const body = (await res.json().catch(() => null)) as T | ApiErrorBody | null

  if (!res.ok) {
    const errBody = body as ApiErrorBody | null
    throw new ApiError(res.status, errBody?.error.code ?? 'UNKNOWN', errBody?.error.message ?? 'Request failed')
  }

  return body as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
