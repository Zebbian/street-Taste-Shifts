import { z } from 'zod'

export const positionSchema = z.enum(['HOST', 'WAITRESS', 'BARTENDER', 'RUNNER', 'MANAGER'])

export const registerStaffSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(120),
  position: positionSchema,
  hourlyRateCents: z.number().int().positive().max(1_000_000),
})

export const registerManagerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(120),
})

export const updateUserSchema = z
  .object({
    fullName: z.string().min(1).max(120).optional(),
    position: positionSchema.optional(),
    hourlyRateCents: z.number().int().positive().max(1_000_000).nullable().optional(),
    sundayRateCents: z.number().int().positive().max(1_000_000).nullable().optional(),
    active: z.boolean().optional(),
    // Admin-only field (enforced in the route, not here): promote/demote
    // between MANAGER and STAFF. ADMIN is intentionally never settable
    // through this endpoint.
    role: z.enum(['MANAGER', 'STAFF']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' })

// The shift's local calendar date (YYYY-MM-DD, no timezone ambiguity) —
// used to decide whether the Sunday premium rate applies. Sent separately
// from startsAt/endsAt (which are UTC instants) because deriving local
// day-of-week from a UTC timestamp requires knowing the restaurant's
// timezone, which the server doesn't track.
const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'localDate must be YYYY-MM-DD')

export const createShiftSchema = z
  .object({
    staffId: z.string().uuid(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    localDate: localDateSchema,
    position: positionSchema,
    notes: z.string().max(500).optional(),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  })

export const updateShiftSchema = z
  .object({
    staffId: z.string().uuid().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    localDate: localDateSchema.optional(),
    position: positionSchema.optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' })

export const weekQuerySchema = z.object({
  week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'week must be YYYY-MM-DD'),
  // The client's local start-of-week instant, as a UTC timestamp. Optional
  // for backward compatibility; when present it's used instead of
  // re-deriving the boundary from `week` in UTC, which can misfile shifts
  // near midnight for any timezone other than UTC.
  weekStart: z.string().datetime().optional(),
})

export const payPeriodQuerySchema = z.object({
  // The client's local reference date (YYYY-MM-DD) and the true UTC instant
  // of that date's local midnight — both required together, or both
  // omitted to get the period containing the server's current date.
  periodDate: localDateSchema.optional(),
  periodDateInstant: z.string().datetime().optional(),
})
