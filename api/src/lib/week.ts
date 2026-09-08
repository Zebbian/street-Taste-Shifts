/** Whether a YYYY-MM-DD date string falls on a Sunday. No timezone involved — treated as a bare calendar date. */
export function isSundayDate(localDate: string): boolean {
  const [y, m, d] = localDate.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay() === 0
}

// Fixed reference Monday all 14-day pay periods align to: Mon 2026-09-07 —
// Sun 2026-09-20 is the first period, paid that Sunday; periods repeat
// continuously from there in both directions.
const PAY_PERIOD_ANCHOR_UTC = Date.UTC(2026, 8, 7) // month is 0-indexed: 8 = September
const MS_PER_DAY = 24 * 60 * 60 * 1000
const PAY_PERIOD_DAYS = 14

/**
 * Given the client's local reference date (YYYY-MM-DD, no timezone
 * ambiguity) and the true UTC instant of that date's local midnight
 * (`localMidnightUtc`, as computed by the client — the same pattern
 * weekRangeUtc uses), returns the [start, start + 14 days) instant range
 * for the 14-day pay period containing that date, aligned to the fixed
 * anchor. `start` is derived by shifting the client's own instant by whole
 * periods, so it's never reconstructed from scratch on the server — no
 * risk of drifting a day off in either timezone direction.
 *
 * Both arguments are optional; omitting them returns the period containing
 * the server's current date (fine for local dev, not timezone-safe for a
 * production restaurant outside UTC).
 */
export function payPeriodRangeUtc(localDate?: string, localMidnightUtc?: string): { start: Date; end: Date } {
  const referenceInstant = localMidnightUtc ? new Date(localMidnightUtc).getTime() : Date.now()

  const [y, m, d] = localDate ? localDate.split('-').map(Number) : todayUtcParts()
  const dateOnlyUtc = Date.UTC(y!, m! - 1, d!)
  const daysSinceAnchor = Math.round((dateOnlyUtc - PAY_PERIOD_ANCHOR_UTC) / MS_PER_DAY)
  const periodsSinceAnchor = Math.floor(daysSinceAnchor / PAY_PERIOD_DAYS)

  const start = new Date(referenceInstant - (daysSinceAnchor - periodsSinceAnchor * PAY_PERIOD_DAYS) * MS_PER_DAY)
  const end = new Date(start.getTime() + PAY_PERIOD_DAYS * MS_PER_DAY)

  return { start, end }
}

function todayUtcParts(): [number, number, number] {
  const now = new Date()
  return [now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate()]
}

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
