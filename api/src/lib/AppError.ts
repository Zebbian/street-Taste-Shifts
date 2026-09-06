export class AppError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }

  static badRequest(message: string, code = 'BAD_REQUEST') {
    return new AppError(400, code, message)
  }
  static unauthorized(message = 'Authentication required') {
    return new AppError(401, 'UNAUTHORIZED', message)
  }
  static forbidden(message = 'You do not have access to this resource') {
    return new AppError(403, 'FORBIDDEN', message)
  }
  static notFound(message = 'Not found') {
    return new AppError(404, 'NOT_FOUND', message)
  }
  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message)
  }
}
