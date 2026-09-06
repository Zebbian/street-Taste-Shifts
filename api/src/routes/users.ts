import { Router } from 'express'
import { Role } from '@prisma/client'
import { loadCurrentUser, requireAuth, requireRole } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { AppError } from '../lib/AppError.js'
import { registerStaffSchema, updateUserSchema } from '../schemas.js'
import { requireParam } from '../lib/params.js'

export const usersRouter = Router()

usersRouter.use(requireAuth, loadCurrentUser)

// Any authenticated user can read their own profile.
usersRouter.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.currentUser!.id } })
    res.json({ user })
  } catch (err) {
    next(err)
  }
})

usersRouter.get('/', requireRole(Role.MANAGER), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { fullName: 'asc' } })
    res.json({ users })
  } catch (err) {
    next(err)
  }
})

// Creates a real Supabase Auth account (invite email, no manager-known password)
// plus the corresponding app-level user row.
usersRouter.post('/register-staff', requireRole(Role.MANAGER), async (req, res, next) => {
  try {
    const body = registerStaffSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) throw AppError.conflict('A user with this email already exists')

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(body.email, {
      data: { full_name: body.fullName, role: Role.STAFF },
    })
    if (error || !data.user) {
      throw AppError.badRequest(error?.message ?? 'Failed to invite staff member', 'INVITE_FAILED')
    }

    const user = await prisma.user.create({
      data: {
        id: data.user.id,
        email: body.email,
        fullName: body.fullName,
        role: Role.STAFF,
        position: body.position,
        hourlyRateCents: body.hourlyRateCents,
      },
    })

    res.status(201).json({ user })
  } catch (err) {
    next(err)
  }
})

usersRouter.patch('/:id', requireRole(Role.MANAGER), async (req, res, next) => {
  try {
    const body = updateUserSchema.parse(req.body)
    const user = await prisma.user.update({ where: { id: requireParam(req, 'id') }, data: body })
    res.json({ user })
  } catch (err) {
    next(err)
  }
})
