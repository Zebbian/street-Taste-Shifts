import { z } from 'zod'

export const positionSchema = z.enum(['SERVER', 'BARTENDER', 'LINE_COOK', 'HOST', 'DISHWASHER', 'MANAGER'])

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
    active: z.boolean().optional(),
    // Admin-only field (enforced in the route, not here): promote/demote
    // between MANAGER and STAFF. ADMIN is intentionally never settable
    // through this endpoint.
    role: z.enum(['MANAGER', 'STAFF']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' })

export const createShiftSchema = z
  .object({
    staffId: z.string().uuid(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
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
    position: positionSchema.optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' })

export const weekQuerySchema = z.object({
  week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'week must be YYYY-MM-DD'),
})
