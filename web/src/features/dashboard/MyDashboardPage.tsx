import { useMyEarnings } from './useMyEarnings'
import { formatCents, formatHours } from '../../lib/format'
import type { ShiftTotals } from '../../types/api'

function SummaryCard({ label, totals, highlight }: { label: string; totals?: ShiftTotals; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? 'border-gold-400 bg-gold-50' : 'border-neutral-200 bg-white'
      }`}
    >
      <p className={`text-xs uppercase tracking-wide ${highlight ? 'text-gold-600' : 'text-neutral-400'}`}>
        {label}
      </p>
      <p className={`mt-1 text-xl font-semibold ${highlight ? 'text-ink-900' : 'text-neutral-900'}`}>
        {totals ? formatCents(totals.totalCents) : '—'}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500">
        {totals ? `${formatHours(totals.totalHours)} · ${totals.shiftCount} shift${totals.shiftCount === 1 ? '' : 's'}` : ''}
      </p>
    </div>
  )
}

export function MyDashboardPage() {
  const { data, isLoading } = useMyEarnings()

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-neutral-900">My earnings</h1>
        <p className="text-xs text-neutral-400">Hours and pay from your assigned shifts</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard label="Today" totals={data?.today} />
          <SummaryCard label="This week" totals={data?.thisWeek} />
          <SummaryCard label="This month" totals={data?.thisMonth} highlight />
        </div>
      )}
    </div>
  )
}
