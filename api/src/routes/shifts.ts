import { Router } from 'express'
import { Role } from '@prisma/client'
import { loadCurrentUser, requireAuth, requireRole } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'
import { createShiftSchema, updateShiftSchema, weekQuerySchema } from '../schemas.js'
import { weekRangeUtc } from '../lib/week.js'
import { requireParam } from '../lib/params.js'

export const shiftsRouter = Router()

shiftsRouter.use(requireAuth, loadCurrentUser)

shiftsRouter.get('/', async (req, res, next) => {
  try {
    const { week } = weekQuerySchema.parse(req.query)
    const { start, end } = weekRangeUtc(week)

    // Staff can only ever see their own shifts — never trust a client-supplied
    // staffId filter for this; scope is derived from the authenticated user.
    const staffFilter = req.currentUser!.role === Role.MANAGER ? {} : { staffId: req.currentUser!.id }

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

shiftsRouter.post('/', requireRole(Role.MANAGER), async (req, res, next) => {
  try {
    const body = createShiftSchema.parse(req.body)

    const staff = await prisma.user.findUnique({ where: { id: body.staffId } })
    if (!staff || !staff.active) throw AppError.badRequest('Staff member not found or inactive')
    if (staff.hourlyRateCents == null) {
      throw AppError.badRequest('Staff member has no hourly rate set')
    }

    const shift = await prisma.shift.create({
      data: {
        staffId: body.staffId,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        position: body.position,
        notes: body.notes,
        hourlyRateCentsSnapshot: staff.hourlyRateCents,
        createdById: req.currentUser!.id,
      },
      include: { staff: { select: { id: true, fullName: true, position: true } } },
    })

    res.status(201).json({ shift })
  } catch (err) {
    next(err)
  }
})

shiftsRouter.patch('/:id', requireRole(Role.MANAGER), async (req, res, next) => {
  try {
    const body = updateShiftSchema.parse(req.body)
    const shiftId = requireParam(req, 'id')
    const existing = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!existing) throw AppError.notFound('Shift not found')

    // Re-snapshot the rate if the assigned staff member changes.
    let hourlyRateCentsSnapshot: number | undefined
    if (body.staffId && body.staffId !== existing.staffId) {
      const staff = await prisma.user.findUnique({ where: { id: body.staffId } })
      if (!staff || !staff.active) throw AppError.badRequest('Staff member not found or inactive')
      if (staff.hourlyRateCents == null) throw AppError.badRequest('Staff member has no hourly rate set')
      hourlyRateCentsSnapshot = staff.hourlyRateCents
    }

    const shift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        ...body,
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

shiftsRouter.delete('/:id', requireRole(Role.MANAGER), async (req, res, next) => {
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
