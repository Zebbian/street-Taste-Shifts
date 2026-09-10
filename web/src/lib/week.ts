/** Formats a Date as a local YYYY-MM-DD calendar-date string (never use toISOString for this — it converts to UTC and can shift the date by a day). */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfWeekIso(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toLocalDateKey(d)
}

export function addWeeks(weekStartIso: string, delta: number): string {
  const d = new Date(`${weekStartIso}T00:00:00`)
  d.setDate(d.getDate() + delta * 7)
  return toLocalDateKey(d)
}

export function weekDays(weekStartIso: string): Date[] {
  const start = new Date(`${weekStartIso}T00:00:00`)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

/** The UTC instant corresponding to local midnight on the given week-start date — send this to the API so it queries the same local day boundaries the UI shows. */
export function weekStartInstant(weekStartIso: string): string {
  return new Date(`${weekStartIso}T00:00:00`).toISOString()
}

export function formatWeekLabel(weekStartIso: string): string {
  const days = weekDays(weekStartIso)
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  return `${fmt.format(days[0]!)} – ${fmt.format(days[6]!)}`
}

// Fixed reference Monday all 14-day pay periods align to (must match the
// backend's PAY_PERIOD_ANCHOR_UTC in api/src/lib/week.ts): Mon 2026-09-07 —
// Sun 2026-09-20 is the first period, paid that Sunday.
const PAY_PERIOD_ANCHOR = new Date(2026, 8, 7) // month is 0-indexed: 8 = September
const PAY_PERIOD_DAYS = 14

/** Snaps any local date to the start (a Monday) of the 14-day pay period containing it. */
export function payPeriodStartIso(date: Date = new Date()): string {
  const daysSinceAnchor = Math.floor((date.getTime() - PAY_PERIOD_ANCHOR.getTime()) / 86_400_000)
  const periodsSinceAnchor = Math.floor(daysSinceAnchor / PAY_PERIOD_DAYS)
  const start = new Date(PAY_PERIOD_ANCHOR)
  start.setDate(start.getDate() + periodsSinceAnchor * PAY_PERIOD_DAYS)
  return toLocalDateKey(start)
}

export function addPayPeriods(periodStartIso: string, delta: number): string {
  const d = new Date(`${periodStartIso}T00:00:00`)
  d.setDate(d.getDate() + delta * PAY_PERIOD_DAYS)
  return toLocalDateKey(d)
}

export function payPeriodDays(periodStartIso: string): Date[] {
  const start = new Date(`${periodStartIso}T00:00:00`)
  return Array.from({ length: PAY_PERIOD_DAYS }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export function formatPayPeriodLabel(periodStartIso: string): string {
  const days = payPeriodDays(periodStartIso)
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  return `${fmt.format(days[0]!)} – ${fmt.format(days[13]!)}`
}

/** The UTC instant for local midnight on the given pay-period-start date — send this to the API. */
export function payPeriodStartInstant(periodStartIso: string): string {
  return new Date(`${periodStartIso}T00:00:00`).toISOString()
}

/** The UTC instant for local midnight today. */
export function todayStartInstant(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
}

export function startOfMonthIso(date: Date = new Date()): string {
  return toLocalDateKey(new Date(date.getFullYear(), date.getMonth(), 1))
}

/** The UTC instant for local midnight on the 1st of the given month (YYYY-MM-DD, any day in that month). */
export function monthStartInstant(monthDateIso: string): string {
  const [y, m] = monthDateIso.split('-').map(Number)
  return new Date(y!, m! - 1, 1).toISOString()
}
