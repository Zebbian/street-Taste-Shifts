import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useCreateShift, useDeleteShift, useShifts, useUpdateShift } from './useShifts'
import { ShiftForm, type ShiftFormValues } from './ShiftForm'
import { Modal } from '../../components/Modal'
import { addWeeks, formatWeekLabel, startOfWeekIso, weekDays } from '../../lib/week'
import { formatHours, formatRateCents, formatTimeRange, shiftHours } from '../../lib/format'
import { POSITION_LABELS } from '../../lib/positions'
import type { Shift } from '../../types/api'

function toLocalDateTimeIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString()
}

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10)
}

function toTimeInputValue(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function SchedulePage() {
  const { user } = useAuth()
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN'
  const [week, setWeek] = useState(() => startOfWeekIso())
  const { data: shifts, isLoading } = useShifts(week)
  const createShift = useCreateShift()
  const updateShift = useUpdateShift()
  const deleteShift = useDeleteShift()

  const [modalDate, setModalDate] = useState<string | null>(null)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)

  const days = useMemo(() => weekDays(week), [week])

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>()
    for (const shift of shifts ?? []) {
      const key = toDateInputValue(shift.startsAt)
      map.set(key, [...(map.get(key) ?? []), shift])
    }
    return map
  }, [shifts])

  async function handleCreate(values: ShiftFormValues) {
    await createShift.mutateAsync({
      staffId: values.staffId,
      startsAt: toLocalDateTimeIso(values.date, values.startTime),
      endsAt: toLocalDateTimeIso(values.date, values.endTime),
      position: values.position,
      notes: values.notes || undefined,
    })
    setModalDate(null)
  }

  async function handleUpdate(values: ShiftFormValues) {
    if (!editingShift) return
    await updateShift.mutateAsync({
      id: editingShift.id,
      input: {
        staffId: values.staffId,
        startsAt: toLocalDateTimeIso(values.date, values.startTime),
        endsAt: toLocalDateTimeIso(values.date, values.endTime),
        position: values.position,
        notes: values.notes || undefined,
      },
    })
    setEditingShift(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this shift?')) return
    await deleteShift.mutateAsync(id)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Schedule</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeek((w) => addWeeks(w, -1))}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="w-36 text-center text-sm font-medium text-neutral-700">{formatWeekLabel(week)}</span>
          <button
            onClick={() => setWeek((w) => addWeeks(w, 1))}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading schedule…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((day) => {
            const key = day.toISOString().slice(0, 10)
            const dayShifts = shiftsByDay.get(key) ?? []
            return (
              <div key={key} className="rounded-xl border border-neutral-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">
                    {new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric' }).format(day)}
                  </span>
                  {isManager && (
                    <button
                      onClick={() => setModalDate(key)}
                      className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      aria-label="Add shift"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {dayShifts.length === 0 && <p className="text-xs text-neutral-400">No shifts</p>}
                  {dayShifts.map((shift) => (
                    <div key={shift.id} className="rounded-lg bg-neutral-50 p-2 text-xs">
                      <p className="font-medium text-neutral-800">{shift.staff.fullName}</p>
                      <p className="text-neutral-500">{formatTimeRange(shift.startsAt, shift.endsAt)}</p>
                      <p className="text-neutral-500">{POSITION_LABELS[shift.position]}</p>
                      <p className="mt-1 text-neutral-400">
                        {formatHours(shiftHours(shift.startsAt, shift.endsAt))} ·{' '}
                        {formatRateCents(shift.hourlyRateCentsSnapshot)}
                      </p>
                      {isManager && (
                        <div className="mt-1 flex gap-2">
                          <button
                            onClick={() => setEditingShift(shift)}
                            className="text-neutral-500 underline hover:text-neutral-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(shift.id)}
                            className="text-red-500 underline hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalDate && (
        <Modal title="Assign shift" onClose={() => setModalDate(null)}>
          <ShiftForm
            defaultValues={{ date: modalDate, startTime: '09:00', endTime: '17:00' }}
            onSubmit={handleCreate}
            onCancel={() => setModalDate(null)}
            submitLabel="Assign shift"
          />
        </Modal>
      )}

      {editingShift && (
        <Modal title="Edit shift" onClose={() => setEditingShift(null)}>
          <ShiftForm
            defaultValues={{
              staffId: editingShift.staffId,
              date: toDateInputValue(editingShift.startsAt),
              startTime: toTimeInputValue(editingShift.startsAt),
              endTime: toTimeInputValue(editingShift.endsAt),
              position: editingShift.position,
              notes: editingShift.notes ?? '',
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingShift(null)}
            submitLabel="Save changes"
          />
        </Modal>
      )}
    </div>
  )
}
