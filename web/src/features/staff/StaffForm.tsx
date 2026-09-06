import { useForm } from 'react-hook-form'
import { STAFF_POSITIONS, POSITION_LABELS } from '../../lib/positions'
import type { Position } from '../../types/api'

export interface StaffFormValues {
  email: string
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
  } = useForm<StaffFormValues>({ defaultValues: { position: 'SERVER' } })

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
        <label className="block text-sm font-medium text-neutral-700">Email</label>
        <input
          type="email"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          {...register('email', { required: 'Email is required' })}
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        <p className="mt-1 text-xs text-neutral-400">They'll receive an email invite to set their own password.</p>
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
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Sending invite…' : 'Add staff member'}
        </button>
      </div>
    </form>
  )
}
