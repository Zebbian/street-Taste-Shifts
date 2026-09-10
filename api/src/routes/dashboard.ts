import { Router } from 'express'
import { Role } from '@prisma/client'
import { loadCurrentUser, requireAuth, requireRole } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { myEarningsQuerySchema, payPeriodQuerySchema } from '../schemas.js'
import { dayRangeUtc, monthRangeUtc, payPeriodRangeUtc, weekRangeUtc } from '../lib/week.js'
import { sumShifts } from '../lib/shiftMath.js'

export const dashboardRouter = Router()

dashboardRouter.use(requireAuth, loadCurrentUser)

dashboardRouter.get('/payroll', requireRole(Role.ADMIN, Role.MANAGER), async (req, res, next) => {
  try {
    const { periodDate, periodDateInstant } = payPeriodQuerySchema.parse(req.query)
    const { start, end } = payPeriodRangeUtc(periodDate, periodDateInstant)

    const shifts = await prisma.shift.findMany({
      where: { startsAt: { gte: start, lt: end } },
      include: { staff: { select: { id: true, fullName: true, position: true } } },
    })

    const byStaff = new Map<
      string,
      { staffId: string; fullName: string; position: string; totalMinutes: number; totalCents: number; shiftCount: number }
    >()

    for (const shift of shifts) {
      const minutes = Math.round((shift.endsAt.getTime() - shift.startsAt.getTime()) / 60_000)
      const cents = Math.round((minutes / 60) * shift.hourlyRateCentsSnapshot)

      const entry = byStaff.get(shift.staffId) ?? {
        staffId: shift.staffId,
        fullName: shift.staff.fullName,
        position: shift.staff.position,
        totalMinutes: 0,
        totalCents: 0,
        shiftCount: 0,
      }
      entry.totalMinutes += minutes
      entry.totalCents += cents
      entry.shiftCount += 1
      byStaff.set(shift.staffId, entry)
    }

    const payroll = Array.from(byStaff.values())
      .map((e) => ({ ...e, totalHours: Math.round((e.totalMinutes / 60) * 100) / 100 }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName))

    res.json({ periodStart: start.toISOString(), periodEnd: end.toISOString(), payroll })
  } catch (err) {
    next(err)
  }
})

// Any authenticated user's own Today / This Week / This Month hours and
// earnings — a personal summary, not restricted to manager/admin.
dashboardRouter.get('/me', async (req, res, next) => {
  try {
    const { dayStart, weekStart, weekAnchor, monthStart, monthDate } = myEarningsQuerySchema.parse(req.query)

    const day = dayRangeUtc(dayStart)
    const week = weekRangeUtc(weekAnchor ?? new Date().toISOString().slice(0, 10), weekStart)
    const month = monthRangeUtc(monthDate, monthStart)

    const [dayShifts, weekShifts, monthShifts] = await Promise.all([
      prisma.shift.findMany({ where: { staffId: req.currentUser!.id, startsAt: { gte: day.start, lt: day.end } } }),
      prisma.shift.findMany({ where: { staffId: req.currentUser!.id, startsAt: { gte: week.start, lt: week.end } } }),
      prisma.shift.findMany({
        where: { staffId: req.currentUser!.id, startsAt: { gte: month.start, lt: month.end } },
      }),
    ])

    res.json({
      today: sumShifts(dayShifts),
      thisWeek: sumShifts(weekShifts),
      thisMonth: sumShifts(monthShifts),
    })
  } catch (err) {
    next(err)
  }
})
