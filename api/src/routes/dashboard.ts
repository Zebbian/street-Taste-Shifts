import { Router } from 'express'
import { Role } from '@prisma/client'
import { loadCurrentUser, requireAuth, requireRole } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { weekQuerySchema } from '../schemas.js'
import { weekRangeUtc } from '../lib/week.js'

export const dashboardRouter = Router()

dashboardRouter.use(requireAuth, loadCurrentUser)

dashboardRouter.get('/payroll', requireRole(Role.ADMIN, Role.MANAGER), async (req, res, next) => {
  try {
    const { week } = weekQuerySchema.parse(req.query)
    const { start, end } = weekRangeUtc(week)

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

    res.json({ week, payroll })
  } catch (err) {
    next(err)
  }
})
