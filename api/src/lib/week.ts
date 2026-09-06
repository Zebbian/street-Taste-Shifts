/** Given a YYYY-MM-DD anchor date, returns the [Monday 00:00, next Monday 00:00) UTC range containing it. */
export function weekRangeUtc(anchor: string): { start: Date; end: Date } {
  const [y, m, d] = anchor.split('-').map(Number)
  const date = new Date(Date.UTC(y!, m! - 1, d!))
  const dayOfWeek = date.getUTCDay() // 0 = Sunday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

  const start = new Date(date)
  start.setUTCDate(date.getUTCDate() + diffToMonday)
  start.setUTCHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 7)

  return { start, end }
}
