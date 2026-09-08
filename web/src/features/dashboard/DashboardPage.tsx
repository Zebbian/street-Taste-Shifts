import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePayroll } from './usePayroll'
import { addPayPeriods, formatPayPeriodLabel, payPeriodStartIso } from '../../lib/week'
import { formatCents, formatHours } from '../../lib/format'
import { POSITION_LABELS } from '../../lib/positions'

export function DashboardPage() {
  const [periodStart, setPeriodStart] = useState(() => payPeriodStartIso())
  const { data, isLoading } = usePayroll(periodStart)

  const totalCents = data?.payroll.reduce((sum, p) => sum + p.totalCents, 0) ?? 0
  const totalHours = data?.payroll.reduce((sum, p) => sum + p.totalHours, 0) ?? 0

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Payroll dashboard</h1>
          <p className="text-xs text-neutral-400">14-day pay period, paid the closing Sunday</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPeriodStart((p) => addPayPeriods(p, -1))}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
            aria-label="Previous pay period"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="w-44 text-center text-sm font-medium text-neutral-700">
            {formatPayPeriodLabel(periodStart)}
          </span>
          <button
            onClick={() => setPeriodStart((p) => addPayPeriods(p, 1))}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
            aria-label="Next pay period"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Total hours</p>
          <p className="mt-1 text-xl font-semibold text-neutral-900">{formatHours(totalHours)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-400">Total payroll</p>
          <p className="mt-1 text-xl font-semibold text-neutral-900">{formatCents(totalCents)}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading payroll…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2">Staff member</th>
                <th className="px-4 py-2">Position</th>
                <th className="px-4 py-2">Shifts</th>
                <th className="px-4 py-2">Hours</th>
                <th className="px-4 py-2">Amount owed</th>
              </tr>
            </thead>
            <tbody>
              {data?.payroll.map((entry) => (
                <tr key={entry.staffId} className="border-t border-neutral-100">
                  <td className="px-4 py-2 font-medium text-neutral-800">{entry.fullName}</td>
                  <td className="px-4 py-2 text-neutral-600">{POSITION_LABELS[entry.position]}</td>
                  <td className="px-4 py-2 text-neutral-600">{entry.shiftCount}</td>
                  <td className="px-4 py-2 text-neutral-600">{formatHours(entry.totalHours)}</td>
                  <td className="px-4 py-2 font-medium text-neutral-800">{formatCents(entry.totalCents)}</td>
                </tr>
              ))}
              {(data?.payroll.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                    No shifts scheduled this pay period yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
