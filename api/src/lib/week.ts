/**
 * Given a YYYY-MM-DD anchor date and (optionally) the caller's actual local
 * start-of-week instant, returns the [start, start + 7 days) range to query.
 *
 * When `explicitStart` is provided (the client's local midnight Monday,
 * as a UTC instant) it's used directly — this is what makes the range match
 * shifts stored from any non-UTC timezone. Without it, this falls back to
 * treating `anchor` as a UTC date, which only lines up correctly for
 * clients in UTC.
 */
export function weekRangeUtc(anchor: string, explicitStart?: string): { start: Date; end: Date } {
  let start: Date

  if (explicitStart) {
    start = new Date(explicitStart)
  } else {
    const [y, m, d] = anchor.split('-').map(Number)
    const date = new Date(Date.UTC(y!, m! - 1, d!))
    const dayOfWeek = date.getUTCDay() // 0 = Sunday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    start = new Date(date)
    start.setUTCDate(date.getUTCDate() + diffToMonday)
    start.setUTCHours(0, 0, 0, 0)
  }

  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 7)

  return { start, end }
}
