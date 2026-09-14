import { forwardRef } from 'react'
import { formatTimeRangeCompact } from '../../lib/format'
import { toLocalDateKey } from '../../lib/week'
import type { Shift } from '../../types/api'

interface ScheduleImageProps {
  weekLabel: string
  days: Date[]
  shiftsByDay: Map<string, Shift[]>
}

/**
 * Printable version of the week's schedule, one row per staff member with
 * Mon–Sun columns — shown in a preview modal and captured to a PNG for the
 * manager to share over WhatsApp. Deliberately separate from the
 * interactive schedule grid: no edit/delete controls, no rates, just names
 * and times, readable at a glance on any phone.
 */
export const ScheduleImage = forwardRef<HTMLDivElement, ScheduleImageProps>(function ScheduleImage(
  { weekLabel, days, shiftsByDay },
  ref
) {
  const staffByName = new Map<string, { name: string; byDay: Map<string, Shift> }>()

  for (const day of days) {
    const key = toLocalDateKey(day)
    for (const shift of shiftsByDay.get(key) ?? []) {
      const entry = staffByName.get(shift.staffId) ?? { name: shift.staff.fullName, byDay: new Map() }
      entry.byDay.set(key, shift)
      staffByName.set(shift.staffId, entry)
    }
  }

  const rows = Array.from(staffByName.values()).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div
      ref={ref}
      style={{
        width: '900px',
        maxWidth: '100%',
        background: '#ffffff',
        padding: '32px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '9999px', background: '#16803c' }} />
        <div style={{ fontSize: '20px', fontWeight: 600, color: '#17190f' }}>Street Taste</div>
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Schedule — {weekLabel}</div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                background: '#17190f',
                color: '#ffffff',
                borderTopLeftRadius: '8px',
              }}
            >
              Staff
            </th>
            {days.map((day, i) => (
              <th
                key={toLocalDateKey(day)}
                style={{
                  textAlign: 'center',
                  padding: '10px 8px',
                  background: '#17190f',
                  color: '#ffffff',
                  borderTopRightRadius: i === days.length - 1 ? '8px' : undefined,
                }}
              >
                {new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(day)}
                <div style={{ fontSize: '11px', fontWeight: 400, color: '#f0c419' }}>
                  {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(day)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.name} style={{ background: rowIndex % 2 === 0 ? '#ffffff' : '#f0faf1' }}>
              <td style={{ padding: '10px 12px', fontWeight: 600, color: '#17190f', borderBottom: '1px solid #e5e5e5' }}>
                {row.name}
              </td>
              {days.map((day) => {
                const shift = row.byDay.get(toLocalDateKey(day))
                return (
                  <td
                    key={toLocalDateKey(day)}
                    style={{
                      padding: '10px 8px',
                      textAlign: 'center',
                      color: shift ? '#0c5527' : '#c7c7c7',
                      borderBottom: '1px solid #e5e5e5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {shift ? formatTimeRangeCompact(shift.startsAt, shift.endsAt) : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                No shifts scheduled this week.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
})
