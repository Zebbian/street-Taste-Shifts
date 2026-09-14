import { useForm } from 'react-hook-form'
import { STAFF_POSITIONS, POSITION_LABELS } from '../../lib/positions'
import type { Position } from '../../types/api'

export interface StaffFormValues {
  email?: string
  fullName: string
  position: Position
  hourlyRate: string
}

export function StaffForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: StaffFormValues) => Promise<void>
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({ defaultValues: { position: 'HOST' } })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Full name</label>
        <input
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          {...register('fullName', { required: 'Name is required' })}
        />
        {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">Email (optional)</label>
        <input
          type="email"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          {...register('email')}
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        <p className="mt-1 text-xs text-neutral-400">
          Leave blank if this person won't log in for now — you can add their email and send an invite later
          from the staff list. No email is sent right away either way.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">Position</label>
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
        <label className="block text-sm font-medium text-neutral-700">Hourly rate ($)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          {...register('hourlyRate', { required: 'Hourly rate is required' })}
        />
        {errors.hourlyRate && <p className="mt-1 text-xs text-red-600">{errors.hourlyRate.message}</p>}
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
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Adding…' : 'Add staff member'}
        </button>
      </div>
    </form>
  )
}
