import { useForm } from 'react-hook-form'
import { STAFF_POSITIONS, POSITION_LABELS } from '../../lib/positions'
import type { Position, User } from '../../types/api'

export interface EditStaffFormValues {
  position: Position
  hourlyRate: string
  sundayRate: string
}

export function EditStaffForm({
  member,
  onSubmit,
  onCancel,
}: {
  member: User
  onSubmit: (values: EditStaffFormValues) => Promise<void>
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditStaffFormValues>({
    defaultValues: {
      position: member.position,
      hourlyRate: member.hourlyRateCents != null ? (member.hourlyRateCents / 100).toFixed(2) : '',
      sundayRate: member.sundayRateCents != null ? (member.sundayRateCents / 100).toFixed(2) : '',
    },
  })

  const isManager = member.role === 'MANAGER' || member.role === 'ADMIN'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {!isManager && (
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
      )}

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
        <p className="mt-1 text-xs text-neutral-400">
          New shifts assigned to {member.fullName} will use this rate. Past shifts keep the rate they were
          created with.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700">Sunday rate ($, optional)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Same as hourly rate"
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          {...register('sundayRate')}
        />
        <p className="mt-1 text-xs text-neutral-400">
          If set, any Sunday shift assigned to {member.fullName} uses this rate instead. Leave blank to use
          their normal hourly rate on Sundays too.
        </p>
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
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
