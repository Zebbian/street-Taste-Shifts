import type { NextFunction, Request, Response } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { env } from '../env.js'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/AppError.js'
import type { Role } from '@prisma/client'

const jwks = createRemoteJWKSet(new URL(env.SUPABASE_JWKS_URL))

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { id: string; email: string }
      currentUser?: { id: string; role: Role; fullName: string; active: boolean }
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw AppError.unauthorized()
    }
    const token = header.slice('Bearer '.length)

    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${env.SUPABASE_URL}/auth/v1`,
    })

    if (!payload.sub || typeof payload.email !== 'string') {
      throw AppError.unauthorized('Malformed token')
    }

    req.auth = { id: payload.sub, email: payload.email }
    next()
  } catch (err) {
    if (err instanceof AppError) return next(err)
    next(AppError.unauthorized('Invalid or expired session'))
  }
}

/**
 * Loads the app-level user row for the authenticated request and rejects
 * deactivated accounts. Must run after requireAuth.
 */
export async function loadCurrentUser(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw AppError.unauthorized()

    const user = await prisma.user.findUnique({ where: { id: req.auth.id } })
    if (!user) throw AppError.unauthorized('No account found for this session')
    if (!user.active) throw AppError.forbidden('This account has been deactivated')

    req.currentUser = { id: user.id, role: user.role, fullName: user.fullName, active: user.active }
    next()
  } catch (err) {
    next(err)
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.currentUser) return next(AppError.unauthorized())
    if (!roles.includes(req.currentUser.role)) {
      return next(AppError.forbidden())
    }
    next()
  }
}
