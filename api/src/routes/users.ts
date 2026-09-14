import { Router } from 'express'
import { Role } from '@prisma/client'
import { loadCurrentUser, requireAuth, requireRole } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { AppError } from '../lib/AppError.js'
import { registerStaffSchema, registerManagerSchema, setEmailSchema, updateUserSchema } from '../schemas.js'
import { requireParam } from '../lib/params.js'
import { env } from '../env.js'

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

usersRouter.get('/', requireRole(Role.ADMIN, Role.MANAGER), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { fullName: 'asc' } })
    res.json({ users })
  } catch (err) {
    next(err)
  }
})

// Creates a staff record. Email is optional: with no email, this is purely a
// schedule/payroll entry with no login capability. With an email, it also
// creates the real Supabase Auth account (no invite sent yet — see
// POST /:id/send-invite). No manager-known password is ever set; the person
// sets their own once invited.
usersRouter.post('/register-staff', requireRole(Role.ADMIN, Role.MANAGER), async (req, res, next) => {
  try {
    const body = registerStaffSchema.parse(req.body)

    if (body.email) {
      const existing = await prisma.user.findUnique({ where: { email: body.email } })
      if (existing) throw AppError.conflict('A user with this email already exists')
    }

    let authId: string | undefined
    if (body.email) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        email_confirm: true,
        user_metadata: { full_name: body.fullName, role: Role.STAFF },
      })
      if (error || !data.user) {
        throw AppError.badRequest(error?.message ?? 'Failed to create staff account', 'CREATE_FAILED')
      }
      authId = data.user.id
    }

    const user = await prisma.user.create({
      data: {
        authId,
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

// Admin-only: creates a new manager account (no email sent yet, same as staff).
usersRouter.post('/register-manager', requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const body = registerManagerSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) throw AppError.conflict('A user with this email already exists')

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      email_confirm: true,
      user_metadata: { full_name: body.fullName, role: Role.MANAGER },
    })
    if (error || !data.user) {
      throw AppError.badRequest(error?.message ?? 'Failed to create manager account', 'CREATE_FAILED')
    }

    const user = await prisma.user.create({
      data: {
        authId: data.user.id,
        email: body.email,
        fullName: body.fullName,
        role: Role.MANAGER,
        position: Role.MANAGER,
      },
    })

    res.status(201).json({ user })
  } catch (err) {
    next(err)
  }
})

// Adds (or changes) the email on a staff/manager record that doesn't have a
// login yet, creating the real Supabase Auth account for them. Does not send
// anything — POST /:id/send-invite is the separate, explicit next step.
usersRouter.patch('/:id/email', requireRole(Role.ADMIN, Role.MANAGER), async (req, res, next) => {
  try {
    const targetId = requireParam(req, 'id')
    const body = setEmailSchema.parse(req.body)

    const target = await prisma.user.findUnique({ where: { id: targetId } })
    if (!target) throw AppError.notFound('User not found')
    if (target.role !== Role.STAFF && req.currentUser!.role !== Role.ADMIN) {
      throw AppError.forbidden()
    }
    if (target.authId) {
      throw AppError.conflict('This account already has a login email — email changes aren\'t supported yet')
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) throw AppError.conflict('A user with this email already exists')

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      email_confirm: true,
      user_metadata: { full_name: target.fullName, role: target.role },
    })
    if (error || !data.user) {
      throw AppError.badRequest(error?.message ?? 'Failed to create login account', 'CREATE_FAILED')
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { email: body.email, authId: data.user.id },
    })

    res.json({ user })
  } catch (err) {
    next(err)
  }
})

// Sends (or re-sends) the login invite email for an existing account. Can be
// called any time — right after the login email is added, or much later
// once the manager is ready for that person to actually start logging in.
usersRouter.post('/:id/send-invite', requireRole(Role.ADMIN, Role.MANAGER), async (req, res, next) => {
  try {
    const targetId = requireParam(req, 'id')
    const target = await prisma.user.findUnique({ where: { id: targetId } })
    if (!target) throw AppError.notFound('User not found')

    // Managers may invite staff; only an admin may (re)invite a manager/admin.
    if (target.role !== Role.STAFF && req.currentUser!.role !== Role.ADMIN) {
      throw AppError.forbidden()
    }
    if (!target.email || !target.authId) {
      throw AppError.badRequest('Add an email for this person before sending an invite', 'NO_EMAIL')
    }

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(target.email, {
      redirectTo: `${env.CORS_ORIGIN}/accept-invite`,
    })
    if (error) throw AppError.badRequest(error.message, 'INVITE_FAILED')

    const user = await prisma.user.update({ where: { id: targetId }, data: { inviteSentAt: new Date() } })
    res.json({ user })
  } catch (err) {
    next(err)
  }
})

usersRouter.patch('/:id', requireRole(Role.ADMIN, Role.MANAGER), async (req, res, next) => {
  try {
    const body = updateUserSchema.parse(req.body)
    const targetId = requireParam(req, 'id')

    if (body.role !== undefined) {
      if (req.currentUser!.role !== Role.ADMIN) {
        throw AppError.forbidden('Only an admin can change a user\'s role')
      }
      const target = await prisma.user.findUnique({ where: { id: targetId } })
      if (!target) throw AppError.notFound('User not found')
      if (target.role === Role.ADMIN) {
        throw AppError.forbidden('Admin accounts cannot be changed here')
      }
    } else if (req.currentUser!.role !== Role.ADMIN) {
      // Managers may still edit staff (rate/position/active), but never
      // another manager or admin's account.
      const target = await prisma.user.findUnique({ where: { id: targetId } })
      if (!target) throw AppError.notFound('User not found')
      if (target.role !== Role.STAFF) {
        throw AppError.forbidden()
      }
    }

    const user = await prisma.user.update({ where: { id: targetId }, data: body })
    res.json({ user })
  } catch (err) {
    next(err)
  }
})
