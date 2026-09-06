import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { useStaffList } from '../staff/useStaff'
import { POSITION_LABELS, STAFF_POSITIONS } from '../../lib/positions'
import type { Position } from '../../types/api'

export interface ShiftFormValues {
  staffId: string
  date: string
  startTime: string
  endTime: string
  position: Position
  notes: string
}

interface ShiftFormProps {
  defaultValues?: Partial<ShiftFormValues>
  onSubmit: (values: ShiftFormValues) => Promise<void>
  onCancel: () => void
  submitLabel: string
}

export function ShiftForm({ defaultValues, onSubmit, onCancel, submitLabel }: ShiftFormProps) {
  const { data: staff } = useStaffList()
  const activeStaff = staff?.filter((s) => s.role === 'STAFF' && s.active) ?? []

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ShiftFormValues>({ defaultValues })

  const selectedStaffId = watch('staffId')

  useEffect(() => {
    const selected = activeStaff.find((s) => s.id === selectedStaffId)
    if (selected && !defaultValues?.position) {
      setValue('position', selected.position)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStaffId])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Staff member</label>
        <select
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          {...register('staffId', { required: 'Select a staff member' })}
        >
          <option value="">Select…</option>
          {activeStaff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName} ({POSITION_LABELS[s.position]})
            </option>
          ))}
        </select>
        {errors.staffId && <p className="mt-1 text-xs text-red-600">{errors.staffId.message}</p>}
        {activeStaff.length === 0 && (
          <p className="mt-1 text-xs text-neutral-500">No active staff with a pay rate set yet.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">Date</label>
        <input
          type="date"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          {...register('date', { required: 'Date is required' })}
        />
        {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Start time</label>
          <input
            type="time"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            {...register('startTime', { required: 'Required' })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">End time</label>
          <input
            type="time"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            {...register('endTime', { required: 'Required' })}
          />
        </div>
      </div>
      {(errors.startTime || errors.endTime) && (
        <p className="text-xs text-red-600">Start and end time are required.</p>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700">Position worked</label>
        <select
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          {...register('position', { required: true })}
        >
          {STAFF_POSITIONS.map((p) => (
            <option key={p} value={p}>
              {POSITION_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">Notes (optional)</label>
        <textarea
          rows={2}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
