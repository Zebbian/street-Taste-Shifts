import { useForm } from 'react-hook-form'

export interface ManagerFormValues {
  email: string
  fullName: string
}

export function ManagerForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: ManagerFormValues) => Promise<void>
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ManagerFormValues>()

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
          {isSubmitting ? 'Sending invite…' : 'Add manager'}
        </button>
      </div>
    </form>
  )
}
