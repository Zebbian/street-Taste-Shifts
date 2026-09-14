import { forwardRef } from 'react'
import { formatTimeCompact } from '../../lib/format'
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

  const CONTAINER_WIDTH = 1040
  const CONTAINER_PADDING = 32
  const NAME_COL_WIDTH = 140
  const CONTENT_WIDTH = CONTAINER_WIDTH - CONTAINER_PADDING * 2
  const DAY_COL_WIDTH = (CONTENT_WIDTH - NAME_COL_WIDTH) / 7

  return (
    <div
      ref={ref}
      style={{
        width: `${CONTAINER_WIDTH}px`,
        flexShrink: 0,
        boxSizing: 'border-box',
        background: '#ffffff',
        padding: `${CONTAINER_PADDING}px`,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '9999px', background: '#16803c' }} />
        <div style={{ fontSize: '20px', fontWeight: 600, color: '#17190f' }}>Street Taste</div>
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Schedule — {weekLabel}</div>

      <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '13px' }}>
        <colgroup>
          <col style={{ width: `${NAME_COL_WIDTH}px` }} />
          {days.map((day) => (
            <col key={toLocalDateKey(day)} style={{ width: `${DAY_COL_WIDTH}px` }} />
          ))}
        </colgroup>
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
                  padding: '10px 4px',
                  background: '#17190f',
                  color: '#ffffff',
                  borderTopRightRadius: i === days.length - 1 ? '8px' : undefined,
                  overflow: 'hidden',
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
                      padding: '10px 4px',
                      textAlign: 'center',
                      color: shift ? '#0c5527' : '#c7c7c7',
                      borderBottom: '1px solid #e5e5e5',
                      fontSize: '12px',
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}
                  >
                    {shift ? (
                      <>
                        {formatTimeCompact(shift.startsAt)}
                        <br />
                        to {formatTimeCompact(shift.endsAt)}
                      </>
                    ) : (
                      '—'
                    )}
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
