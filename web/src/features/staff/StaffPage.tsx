import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useRegisterManager, useRegisterStaff, useSendInvite, useStaffList, useUpdateStaff } from './useStaff'
import { StaffForm, type StaffFormValues } from './StaffForm'
import { ManagerForm, type ManagerFormValues } from './ManagerForm'
import { EditStaffForm, type EditStaffFormValues } from './EditStaffForm'
import { Modal } from '../../components/Modal'
import { ConfirmModal } from '../../components/ConfirmModal'
import { Toast } from '../../components/Toast'
import { useToast } from '../../lib/useToast'
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
  const sendInvite = useSendInvite()

  const [showAddStaff, setShowAddStaff] = useState(false)
  const [showAddManager, setShowAddManager] = useState(false)
  const [editingMember, setEditingMember] = useState<User | null>(null)
  const [reinviteTarget, setReinviteTarget] = useState<User | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const { toastMessage, showToast, dismissToast } = useToast()

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
      showToast('Staff member added')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to add staff member.')
    }
  }

  async function handleAddManager(values: ManagerFormValues) {
    setFormError(null)
    try {
      await registerManager.mutateAsync(values)
      setShowAddManager(false)
      showToast('Manager added')
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

    let sundayRateCents: number | null = null
    if (values.sundayRate.trim() !== '') {
      const sundayDollars = Number(values.sundayRate)
      if (!Number.isFinite(sundayDollars) || sundayDollars <= 0) {
        setFormError('Enter a valid Sunday rate, or leave it blank.')
        return
      }
      sundayRateCents = Math.round(sundayDollars * 100)
    }

    const isManager = editingMember.role === 'MANAGER' || editingMember.role === 'ADMIN'

    try {
      await updateStaff.mutateAsync({
        id: editingMember.id,
        input: {
          ...(isManager ? {} : { position: values.position }),
          hourlyRateCents: Math.round(dollars * 100),
          sundayRateCents,
        },
      })
      setEditingMember(null)
      showToast('Changes saved')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to update staff member.')
    }
  }

  async function toggleManagerRole(id: string, currentRole: 'MANAGER' | 'STAFF') {
    await updateStaff.mutateAsync({ id, input: { role: currentRole === 'MANAGER' ? 'STAFF' : 'MANAGER' } })
  }

  async function sendInviteNow(id: string) {
    setFormError(null)
    try {
      await sendInvite.mutateAsync(id)
      showToast('Invite sent')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to send invite.')
    }
  }

  function handleSendInvite(member: User) {
    if (member.inviteSentAt) {
      setReinviteTarget(member)
      return
    }
    sendInviteNow(member.id)
  }

  async function handleConfirmReinvite() {
    if (!reinviteTarget) return
    const id = reinviteTarget.id
    setReinviteTarget(null)
    await sendInviteNow(id)
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
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus size={16} /> Add manager
            </button>
          </div>

          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading managers…</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Rate</th>
                    <th className="px-4 py-2">Sunday rate</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Invite</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {managers.map((manager) => (
                    <tr key={manager.id} className="border-t border-neutral-100">
                      <td className="px-4 py-2 font-medium text-neutral-800">{manager.fullName}</td>
                      <td className="px-4 py-2 text-neutral-600">{manager.email}</td>
                      <td className="px-4 py-2 text-neutral-600">
                        {manager.hourlyRateCents != null ? formatRateCents(manager.hourlyRateCents) : '—'}
                      </td>
                      <td className="px-4 py-2 text-neutral-600">
                        {manager.sundayRateCents != null ? formatRateCents(manager.sundayRateCents) : '—'}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            manager.active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {manager.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            manager.inviteSentAt ? 'bg-gold-100 text-gold-600' : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {manager.inviteSentAt ? 'Invited' : 'Not invited'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setEditingMember(manager)}
                            className="text-xs text-neutral-500 underline hover:text-neutral-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleSendInvite(manager)}
                            className="text-xs text-brand-700 underline hover:text-brand-900"
                          >
                            {manager.inviteSentAt ? 'Resend invite' : 'Send invite'}
                          </button>
                          <button
                            onClick={() => toggleManagerRole(manager.id, 'MANAGER')}
                            className="text-xs text-neutral-500 underline hover:text-neutral-800"
                          >
                            Demote to staff
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {managers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-neutral-400">
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
            className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={16} /> Add staff
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading staff…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Position</th>
                  <th className="px-4 py-2">Rate</th>
                  <th className="px-4 py-2">Sunday rate</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Invite</th>
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
                    <td className="px-4 py-2 text-neutral-600">
                      {member.sundayRateCents != null ? formatRateCents(member.sundayRateCents) : '—'}
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
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          member.inviteSentAt ? 'bg-gold-100 text-gold-600' : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {member.inviteSentAt ? 'Invited' : 'Not invited'}
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
                        <button
                          onClick={() => handleSendInvite(member)}
                          className="text-xs text-brand-700 underline hover:text-brand-900"
                        >
                          {member.inviteSentAt ? 'Resend invite' : 'Send invite'}
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
                    <td colSpan={7} className="px-4 py-6 text-center text-neutral-400">
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

      {reinviteTarget && (
        <ConfirmModal
          title="Resend invite"
          message={`Send another invite email to ${reinviteTarget.fullName}?`}
          confirmLabel="Send invite"
          onConfirm={handleConfirmReinvite}
          onCancel={() => setReinviteTarget(null)}
        />
      )}

      {toastMessage && <Toast message={toastMessage} onDismiss={dismissToast} />}
    </div>
  )
}
