export function startOfWeekIso(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function addWeeks(weekStartIso: string, delta: number): string {
  const d = new Date(`${weekStartIso}T00:00:00`)
  d.setDate(d.getDate() + delta * 7)
  return d.toISOString().slice(0, 10)
}

export function weekDays(weekStartIso: string): Date[] {
  const start = new Date(`${weekStartIso}T00:00:00`)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export function formatWeekLabel(weekStartIso: string): string {
  const days = weekDays(weekStartIso)
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  return `${fmt.format(days[0]!)} – ${fmt.format(days[6]!)}`
}
