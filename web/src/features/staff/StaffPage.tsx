import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useRegisterManager, useRegisterStaff, useStaffList, useUpdateStaff } from './useStaff'
import { StaffForm, type StaffFormValues } from './StaffForm'
import { ManagerForm, type ManagerFormValues } from './ManagerForm'
import { EditStaffForm, type EditStaffFormValues } from './EditStaffForm'
import { Modal } from '../../components/Modal'
import { POSITION_LABELS } from '../../lib/positions'
import { formatRateCents } from '../../lib/format'
import { ApiError } from '../../lib/apiClient'
import type { User } from '../../types/api'

export function StaffPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const { data: users, isLoading } = useStaffList()
  const registerStaff = useRegisterStaff()
  const registerManager = useRegisterManager()
  const updateStaff = useUpdateStaff()

  const [showAddStaff, setShowAddStaff] = useState(false)
  const [showAddManager, setShowAddManager] = useState(false)
  const [editingMember, setEditingMember] = useState<User | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleAddStaff(values: StaffFormValues) {
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
      setShowAddStaff(false)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to add staff member.')
    }
  }

  async function handleAddManager(values: ManagerFormValues) {
    setFormError(null)
    try {
      await registerManager.mutateAsync(values)
      setShowAddManager(false)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to add manager.')
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await updateStaff.mutateAsync({ id, input: { active: !active } })
  }

  async function handleEditStaff(values: EditStaffFormValues) {
    if (!editingMember) return
    setFormError(null)
    const dollars = Number(values.hourlyRate)
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setFormError('Enter a valid hourly rate.')
      return
    }
    try {
      await updateStaff.mutateAsync({
        id: editingMember.id,
        input: { position: values.position, hourlyRateCents: Math.round(dollars * 100) },
      })
      setEditingMember(null)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to update staff member.')
    }
  }

  async function toggleManagerRole(id: string, currentRole: 'MANAGER' | 'STAFF') {
    await updateStaff.mutateAsync({ id, input: { role: currentRole === 'MANAGER' ? 'STAFF' : 'MANAGER' } })
  }

  const staffMembers = users?.filter((u) => u.role === 'STAFF') ?? []
  const managers = users?.filter((u) => u.role === 'MANAGER') ?? []

  return (
    <div className="space-y-8">
      {isAdmin && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-neutral-900">Managers</h1>
            <button
              onClick={() => setShowAddManager(true)}
              className="flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              <Plus size={16} /> Add manager
            </button>
          </div>

          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading managers…</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {managers.map((manager) => (
                    <tr key={manager.id} className="border-t border-neutral-100">
                      <td className="px-4 py-2 font-medium text-neutral-800">{manager.fullName}</td>
                      <td className="px-4 py-2 text-neutral-600">{manager.email}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            manager.active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {manager.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => toggleManagerRole(manager.id, 'MANAGER')}
                          className="text-xs text-neutral-500 underline hover:text-neutral-800"
                        >
                          Demote to staff
                        </button>
                      </td>
                    </tr>
                  ))}
                  {managers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                        No other managers yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-neutral-900">Staff</h1>
          <button
            onClick={() => setShowAddStaff(true)}
            className="flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            <Plus size={16} /> Add staff
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading staff…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[560px] text-sm">
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
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setEditingMember(member)}
                          className="text-xs text-neutral-500 underline hover:text-neutral-800"
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => toggleManagerRole(member.id, 'STAFF')}
                            className="text-xs text-neutral-500 underline hover:text-neutral-800"
                          >
                            Promote to manager
                          </button>
                        )}
                        <button
                          onClick={() => toggleActive(member.id, member.active)}
                          className="text-xs text-neutral-500 underline hover:text-neutral-800"
                        >
                          {member.active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
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
      </div>

      {showAddStaff && (
        <Modal title="Add staff member" onClose={() => setShowAddStaff(false)}>
          {formError && <p className="mb-3 text-sm text-red-600">{formError}</p>}
          <StaffForm onSubmit={handleAddStaff} onCancel={() => setShowAddStaff(false)} />
        </Modal>
      )}

      {showAddManager && (
        <Modal title="Add manager" onClose={() => setShowAddManager(false)}>
          {formError && <p className="mb-3 text-sm text-red-600">{formError}</p>}
          <ManagerForm onSubmit={handleAddManager} onCancel={() => setShowAddManager(false)} />
        </Modal>
      )}

      {editingMember && (
        <Modal title={`Edit ${editingMember.fullName}`} onClose={() => setEditingMember(null)}>
          {formError && <p className="mb-3 text-sm text-red-600">{formError}</p>}
          <EditStaffForm member={editingMember} onSubmit={handleEditStaff} onCancel={() => setEditingMember(null)} />
        </Modal>
      )}
    </div>
  )
}
