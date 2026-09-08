import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { supabaseAuth } from '../../lib/supabaseAuth'

interface SetPasswordFormValues {
  password: string
  confirmPassword: string
}

/**
 * Handles Supabase invite/recovery links. supabase-js reads the access token
 * out of the URL hash automatically on load and establishes a session; this
 * page just waits for that, then lets the person set a real password.
 */
export function AcceptInvitePage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [linkInvalid, setLinkInvalid] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordFormValues>()

  useEffect(() => {
    let settled = false

    const { data: sub } = supabaseAuth.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        settled = true
        setReady(true)
      }
    })

    // If a session already exists by the time this mounts (token processed
    // before the listener attached), don't leave the user stuck waiting.
    supabaseAuth.auth.getSession().then(({ data }) => {
      if (!settled && data.session) {
        settled = true
        setReady(true)
      }
    })

    const timeout = setTimeout(() => {
      if (!settled) setLinkInvalid(true)
    }, 4000)

    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function onSubmit(values: SetPasswordFormValues) {
    setServerError(null)
    if (values.password !== values.confirmPassword) return

    const { error } = await supabaseAuth.auth.updateUser({ password: values.password })
    if (error) {
      setServerError(error.message)
      return
    }
    navigate('/schedule', { replace: true })
  }

  if (linkInvalid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-neutral-900">Link expired or invalid</h1>
          <p className="mt-2 text-sm text-neutral-500">
            This invite link is no longer valid. Ask your manager to send a new invite.
          </p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        Verifying invite link…
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">Welcome to Street Taste</h1>
        <p className="mt-1 text-sm text-neutral-500">Set a password to finish setting up your account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } })}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
              {...register('confirmPassword', { required: 'Please confirm your password' })}
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
            {watch('password') !== watch('confirmPassword') && watch('confirmPassword') && (
              <p className="mt-1 text-xs text-red-600">Passwords don't match.</p>
            )}
          </div>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Set password & continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
