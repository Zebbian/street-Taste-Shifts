import type { Request } from 'express'
import { AppError } from './AppError.js'

/** Express types route params as `string | string[] | undefined`; routes here never use repeated params. */
export function requireParam(req: Request, name: string): string {
  const value = req.params[name]
  if (typeof value !== 'string' || value.length === 0) {
    throw AppError.badRequest(`Missing route parameter: ${name}`)
  }
  return value
}
