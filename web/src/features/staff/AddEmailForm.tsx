import { useForm } from 'react-hook-form'

export interface AddEmailFormValues {
  email: string
}

export function AddEmailForm({
  fullName,
  onSubmit,
  onCancel,
}: {
  fullName: string
  onSubmit: (values: AddEmailFormValues) => Promise<void>
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddEmailFormValues>()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Email</label>
        <input
          type="email"
          autoFocus
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          {...register('email', { required: 'Email is required' })}
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        <p className="mt-1 text-xs text-neutral-400">
          This creates {fullName}'s login. No email is sent yet — use Send invite afterward when you're ready.
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
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Add email'}
        </button>
      </div>
    </form>
  )
}
