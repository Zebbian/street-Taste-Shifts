import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useRegisterStaff, useStaffList, useUpdateStaff } from './useStaff'
import { StaffForm, type StaffFormValues } from './StaffForm'
import { Modal } from '../../components/Modal'
import { POSITION_LABELS } from '../../lib/positions'
import { formatRateCents } from '../../lib/format'
import { ApiError } from '../../lib/apiClient'

export function StaffPage() {
  const { data: staff, isLoading } = useStaffList()
  const registerStaff = useRegisterStaff()
  const updateStaff = useUpdateStaff()
  const [showAdd, setShowAdd] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleAdd(values: StaffFormValues) {
    setFormError(null)
    const dollars = Number(values.hourlyRate)
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setFormError('Enter a valid hourly rate.')
      return
    }
    try {
      await registerStaff.mutateAsync({
        email: values.email,
        fullName: values.fullName,
        position: values.position,
        hourlyRateCents: Math.round(dollars * 100),
      })
      setShowAdd(false)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to add staff member.')
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await updateStaff.mutateAsync({ id, input: { active: !active } })
  }

  const staffMembers = staff?.filter((u) => u.role === 'STAFF') ?? []

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Staff</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          <Plus size={16} /> Add staff
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading staff…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Position</th>
                <th className="px-4 py-2">Rate</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {staffMembers.map((member) => (
                <tr key={member.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 font-medium text-neutral-800">{member.fullName}</td>
                  <td className="px-4 py-2 text-neutral-600">{POSITION_LABELS[member.position]}</td>
                  <td className="px-4 py-2 text-neutral-600">
                    {member.hourlyRateCents != null ? formatRateCents(member.hourlyRateCents) : '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        member.active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {member.active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => toggleActive(member.id, member.active)}
                      className="text-xs text-neutral-500 underline hover:text-neutral-800"
                    >
                      {member.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
              {staffMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                    No staff yet — add your first team member.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Add staff member" onClose={() => setShowAdd(false)}>
          {formError && <p className="mb-3 text-sm text-red-600">{formError}</p>}
          <StaffForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
    </div>
  )
}
