import { useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { ChevronLeft, ChevronRight, Download, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useCreateShift, useDeleteShift, useRefreshShiftRate, useShifts, useUpdateShift } from './useShifts'
import { ShiftForm, type ShiftFormValues } from './ShiftForm'
import { ScheduleImage } from './ScheduleImage'
import { Modal } from '../../components/Modal'
import { ConfirmModal } from '../../components/ConfirmModal'
import { Toast } from '../../components/Toast'
import { useToast } from '../../lib/useToast'
import { addWeeks, formatWeekLabel, startOfWeekIso, toLocalDateKey, weekDays } from '../../lib/week'
import { formatCents, formatHours, formatRateCents, formatTimeRange, shiftHours } from '../../lib/format'
import { POSITION_LABELS } from '../../lib/positions'
import type { Shift } from '../../types/api'

function toLocalDateTimeIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString()
}

// The server returns UTC ISO timestamps — slicing the string would grab the
// UTC calendar date, which can differ from the shift's local date. Parse and
// re-derive the date in local time instead.
function toDateInputValue(iso: string): string {
  return toLocalDateKey(new Date(iso))
}

function toTimeInputValue(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function dayTotalCents(dayShifts: Shift[]): number {
  return dayShifts.reduce(
    (sum, shift) => sum + shiftHours(shift.startsAt, shift.endsAt) * shift.hourlyRateCentsSnapshot,
    0
  )
}

export function SchedulePage() {
  const { user } = useAuth()
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN'
  const [week, setWeek] = useState(() => startOfWeekIso())
  const { data: shifts, isLoading } = useShifts(week)
  const createShift = useCreateShift()
  const updateShift = useUpdateShift()
  const deleteShift = useDeleteShift()
  const refreshShiftRate = useRefreshShiftRate()
  const { toastMessage, showToast, dismissToast } = useToast()

  const [modalDate, setModalDate] = useState<string | null>(null)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

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
      localDate: values.date,
      position: values.position,
      notes: values.notes || undefined,
    })
    setModalDate(null)
    showToast('Shift added')
  }

  async function handleUpdate(values: ShiftFormValues) {
    if (!editingShift) return
    await updateShift.mutateAsync({
      id: editingShift.id,
      input: {
        staffId: values.staffId,
        startsAt: toLocalDateTimeIso(values.date, values.startTime),
        endsAt: toLocalDateTimeIso(values.date, values.endTime),
        localDate: values.date,
        position: values.position,
        notes: values.notes || undefined,
      },
    })
    setEditingShift(null)
    showToast('Shift updated')
  }

  async function handleConfirmDelete() {
    if (!deletingShift) return
    await deleteShift.mutateAsync(deletingShift.id)
    setDeletingShift(null)
    showToast('Shift removed')
  }

  async function handleRefreshRate(shift: Shift) {
    await refreshShiftRate.mutateAsync({ id: shift.id, localDate: toDateInputValue(shift.startsAt) })
    showToast('Rate refreshed')
  }

  async function handleDownloadSchedule() {
    if (!exportRef.current) return
    setIsExporting(true)
    try {
      const node = exportRef.current
      // The first capture can come back blank if the browser hasn't finished
      // painting the (visually offscreen) node yet — a known html-to-image
      // quirk. Rendering once and discarding it "warms up" the clone before
      // the real capture.
      await toPng(node, { pixelRatio: 2, backgroundColor: '#ffffff' })
      const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = `street-taste-schedule-${week}.png`
      link.href = dataUrl
      link.click()
      showToast('Schedule downloaded')
    } catch (err) {
      console.error('Failed to generate schedule image:', err)
      showToast('Could not generate the schedule image')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Schedule</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeek((w) => addWeeks(w, -1))}
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-brand-50 hover:text-brand-700"
              aria-label="Previous week"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="w-36 text-center text-sm font-medium text-neutral-700">{formatWeekLabel(week)}</span>
            <button
              onClick={() => setWeek((w) => addWeeks(w, 1))}
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-brand-50 hover:text-brand-700"
              aria-label="Next week"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          {isManager && (
            <button
              onClick={handleDownloadSchedule}
              disabled={isExporting}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Download size={16} />
              {isExporting ? 'Preparing…' : 'Download schedule'}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading schedule…</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((day) => {
            const key = toLocalDateKey(day)
            const dayShifts = shiftsByDay.get(key) ?? []
            const isToday = key === toLocalDateKey(new Date())
            return (
              <div
                key={key}
                className={`flex flex-col rounded-xl border bg-white p-3 ${
                  isToday ? 'border-gold-400 ring-1 ring-gold-400' : 'border-neutral-200'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className={`text-sm font-medium ${isToday ? 'text-brand-700' : 'text-neutral-700'}`}>
                    {new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric' }).format(day)}
                  </span>
                  {isManager && (
                    <button
                      onClick={() => setModalDate(key)}
                      className="rounded p-1 text-neutral-400 hover:bg-brand-50 hover:text-brand-700"
                      aria-label="Add shift"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  {dayShifts.length === 0 && <p className="text-xs text-neutral-400">No shifts</p>}
                  {dayShifts.map((shift) => (
                    <div key={shift.id} className="rounded-lg border-l-2 border-brand-500 bg-brand-50 p-2 text-xs">
                      <p className="font-medium text-neutral-800">{shift.staff.fullName}</p>
                      <p className="text-neutral-500">{formatTimeRange(shift.startsAt, shift.endsAt)}</p>
                      <p className="text-neutral-500">{POSITION_LABELS[shift.position]}</p>
                      <p className="mt-1 text-neutral-500">
                        {formatHours(shiftHours(shift.startsAt, shift.endsAt))} ·{' '}
                        {formatRateCents(shift.hourlyRateCentsSnapshot)}
                      </p>
                      {isManager && (
                        <div className="mt-1 flex items-center justify-between">
                          <button
                            onClick={() => setEditingShift(shift)}
                            aria-label="Edit shift"
                            className="rounded p-1 text-brand-700 hover:bg-brand-100 hover:text-brand-900"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleRefreshRate(shift)}
                            aria-label="Refresh rate from staff member's current pay rate"
                            title="Refresh rate"
                            className="rounded p-1 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingShift(shift)}
                            aria-label="Remove shift"
                            className="rounded p-1 text-red-500 hover:bg-red-100 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {isManager && dayShifts.length > 0 && (
                  <div className="mt-2 border-t border-neutral-100 pt-2 text-xs">
                    <span className="text-neutral-400">Day total </span>
                    <span className="font-semibold text-ink-900">{formatCents(dayTotalCents(dayShifts))}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modalDate && (
        <Modal title="Assign shift" onClose={() => setModalDate(null)}>
          <ShiftForm
            key={modalDate}
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
            key={editingShift.id}
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

      {deletingShift && (
        <ConfirmModal
          title="Remove shift"
          message={`Remove ${deletingShift.staff.fullName}'s shift on ${new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          }).format(new Date(deletingShift.startsAt))}? This can't be undone.`}
          confirmLabel="Remove shift"
          danger
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingShift(null)}
        />
      )}

      {toastMessage && <Toast message={toastMessage} onDismiss={dismissToast} />}

      {isManager && <ScheduleImage ref={exportRef} weekLabel={formatWeekLabel(week)} days={days} shiftsByDay={shiftsByDay} />}
    </div>
  )
}
