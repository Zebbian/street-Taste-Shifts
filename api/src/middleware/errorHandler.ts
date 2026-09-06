import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../lib/AppError.js'
import { logger } from '../lib/logger.js'
import { env } from '../env.js'

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request', issues: err.flatten() },
    })
    return
  }

  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error({ err, reqId: req.id }, err.message)
    }
    res.status(err.status).json({ error: { code: err.code, message: err.message } })
    return
  }

  logger.error({ err, reqId: req.id }, 'Unhandled error')
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' ? 'Something went wrong' : (err as Error).message,
    },
  })
}
