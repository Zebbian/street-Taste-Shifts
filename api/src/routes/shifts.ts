import { Router } from 'express'
import { Role } from '@prisma/client'
import { loadCurrentUser, requireAuth, requireRole } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'
import { createShiftSchema, refreshShiftRateSchema, updateShiftSchema, weekQuerySchema } from '../schemas.js'
import { isSundayDate, weekRangeUtc } from '../lib/week.js'
import { requireParam } from '../lib/params.js'
import type { User } from '@prisma/client'

/** Picks the Sunday premium rate when the shift falls on a Sunday and the staff member has one set, otherwise their normal rate. */
function rateForShift(staff: User, localDate: string): number | null {
  if (isSundayDate(localDate) && staff.sundayRateCents != null) {
    return staff.sundayRateCents
  }
  return staff.hourlyRateCents
}

export const shiftsRouter = Router()

shiftsRouter.use(requireAuth, loadCurrentUser)

shiftsRouter.get('/', async (req, res, next) => {
  try {
    const { week, weekStart } = weekQuerySchema.parse(req.query)
    const { start, end } = weekRangeUtc(week, weekStart)

    // Staff can only ever see their own shifts — never trust a client-supplied
    // staffId filter for this; scope is derived from the authenticated user.
    const isManagerOrAdmin = req.currentUser!.role === Role.MANAGER || req.currentUser!.role === Role.ADMIN
    const staffFilter = isManagerOrAdmin ? {} : { staffId: req.currentUser!.id }

    const shifts = await prisma.shift.findMany({
      where: { ...staffFilter, startsAt: { gte: start, lt: end } },
      include: { staff: { select: { id: true, fullName: true, position: true } } },
      orderBy: { startsAt: 'asc' },
    })

    res.json({ shifts })
  } catch (err) {
    next(err)
  }
})

shiftsRouter.post('/', requireRole(Role.ADMIN, Role.MANAGER), async (req, res, next) => {
  try {
    const body = createShiftSchema.parse(req.body)

    const staff = await prisma.user.findUnique({ where: { id: body.staffId } })
    if (!staff || !staff.active) throw AppError.badRequest('Staff member not found or inactive')
    if (staff.hourlyRateCents == null) {
      throw AppError.badRequest('Staff member has no hourly rate set')
    }

    const rate = rateForShift(staff, body.localDate)
    if (rate == null) throw AppError.badRequest('Staff member has no hourly rate set')

    const shift = await prisma.shift.create({
      data: {
        staffId: body.staffId,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        position: body.position,
        notes: body.notes,
        hourlyRateCentsSnapshot: rate,
        createdById: req.currentUser!.id,
      },
      include: { staff: { select: { id: true, fullName: true, position: true } } },
    })

    res.status(201).json({ shift })
  } catch (err) {
    next(err)
  }
})

shiftsRouter.patch('/:id', requireRole(Role.ADMIN, Role.MANAGER), async (req, res, next) => {
  try {
    const body = updateShiftSchema.parse(req.body)
    const shiftId = requireParam(req, 'id')
    const existing = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!existing) throw AppError.notFound('Shift not found')

    // Re-snapshot the rate whenever the assigned staff member or the shift's
    // date changes — either can affect whether the Sunday premium applies.
    // The frontend's edit form always submits both staffId and localDate
    // together, so require localDate here too rather than guessing the
    // shift's existing date (which isn't stored — only the UTC instant is).
    if (body.staffId && !body.localDate) {
      throw AppError.badRequest('localDate is required when changing staffId')
    }

    let hourlyRateCentsSnapshot: number | undefined
    if (body.localDate) {
      const staff = await prisma.user.findUnique({ where: { id: body.staffId ?? existing.staffId } })
      if (!staff || !staff.active) throw AppError.badRequest('Staff member not found or inactive')
      const rate = rateForShift(staff, body.localDate)
      if (rate == null) throw AppError.badRequest('Staff member has no hourly rate set')
      hourlyRateCentsSnapshot = rate
    }

    const { localDate: _localDate, ...updateFields } = body

    const shift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        ...updateFields,
        startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
        endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
        hourlyRateCentsSnapshot,
      },
      include: { staff: { select: { id: true, fullName: true, position: true } } },
    })

    res.json({ shift })
  } catch (err) {
    next(err)
  }
})

// Re-derives hourlyRateCentsSnapshot from the staff member's current rates
// (hourlyRateCents / sundayRateCents), without changing anything else about
// the shift. For when the rate was edited after the shift was already
// created — shifts otherwise never pick up rate changes retroactively, by
// design, so this is an explicit action rather than something automatic.
shiftsRouter.post('/:id/refresh-rate', requireRole(Role.ADMIN, Role.MANAGER), async (req, res, next) => {
  try {
    const shiftId = requireParam(req, 'id')
    const body = refreshShiftRateSchema.parse(req.body)

    const existing = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!existing) throw AppError.notFound('Shift not found')

    const staff = await prisma.user.findUnique({ where: { id: existing.staffId } })
    if (!staff || !staff.active) throw AppError.badRequest('Staff member not found or inactive')

    const rate = rateForShift(staff, body.localDate)
    if (rate == null) throw AppError.badRequest('Staff member has no hourly rate set')

    const shift = await prisma.shift.update({
      where: { id: shiftId },
      data: { hourlyRateCentsSnapshot: rate },
      include: { staff: { select: { id: true, fullName: true, position: true } } },
    })

    res.json({ shift })
  } catch (err) {
    next(err)
  }
})

shiftsRouter.delete('/:id', requireRole(Role.ADMIN, Role.MANAGER), async (req, res, next) => {
  try {
    const shiftId = requireParam(req, 'id')
    const existing = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!existing) throw AppError.notFound('Shift not found')

    await prisma.shift.delete({ where: { id: shiftId } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})
