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
