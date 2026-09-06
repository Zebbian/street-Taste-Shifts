export function formatTimeRange(startsAt: string, endsAt: string): string {
  const fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${fmt.format(new Date(startsAt))} – ${fmt.format(new Date(endsAt))}`
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(
    new Date(iso)
  )
}

export function shiftHours(startsAt: string, endsAt: string): number {
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime()
  return Math.round((ms / 3_600_000) * 100) / 100
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}h`
}

export function centsToDollars(cents: number): number {
  return cents / 100
}

export function formatCents(cents: number): string {
  return centsToDollars(cents).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function formatRateCents(cents: number): string {
  return `${formatCents(cents)}/hr`
}
