import { useState } from 'react';
import { KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import { CheckboxList } from '@/components/ui/checkbox-list';
import { Modal } from '@/components/ui/modal';
import { useActiveWorkspace, useCan } from '@/data/session';
import {
  useCreateWorkspace,
  useDeleteWorkspace,
  useRelationshipTypes,
  useResetStaffPassword,
  useSetDoctorProfile,
  useStaffTypes,
  useUpdateStaffMember,
  useUpdateWorkspace,
  type StaffMember,
  type Workspace,
} from '@/data/staff';
import { formatNumber } from '@/lib/format';
import { CAN } from '@/lib/permissions';
import { showToast } from '@/lib/toast';
import { staffErrorMessage } from './staff-messages';
import { TemporaryPasswordModal } from './temporary-password-modal';
import { WorkspacePermissionsModal } from './workspace-permissions-modal';

interface StaffDetailProps {
  member: StaffMember;
  /** All members, for choosing the doctor of a new position. */
  staff: StaffMember[];
  onClose: () => void;
}

const isDoctor = (m: StaffMember) => m.staff_types.includes('doctor');

/** One person: who they are, their doctor profile, their workspaces and what each may do, and password reset. */
export function StaffDetail({ member, staff, onClose }: StaffDetailProps) {
  const canReset = useCan(CAN.resetStaffPassword);
  const [password, setPassword] = useState<string | null>(null);
  const [editing, setEditing] = useState<Workspace | null>(null);
  const resetPassword = useResetStaffPassword();

  async function reset() {
    if (!window.confirm(`رمز ${member.full_name} بازنشانی شود؟ از همه دستگاه‌ها خارج می‌شود.`)) return;
    try {
      setPassword(await resetPassword.mutateAsync(member.membership_id));
    } catch (error) {
      showToast(staffErrorMessage(error), 'error');
    }
  }

  return (
    <>
      <Modal open={password === null && editing === null} onClose={onClose} title={member.full_name} size="lg">
        <div className="space-y-6">
          <p className="text-sm text-surface-500 -mt-2" dir="ltr" style={{ textAlign: 'right' }}>
            {member.mobile}
          </p>
          <PersonSection member={member} />
          {isDoctor(member) && <DoctorProfileSection member={member} />}
          <WorkspacesSection member={member} staff={staff} onEdit={setEditing} />
          {canReset && (
            <section className="pt-4 border-t border-surface-100">
              <button type="button" onClick={reset} disabled={resetPassword.isPending} className="btn-secondary text-sm">
                <KeyRound size={15} />
                بازنشانی رمز عبور
              </button>
            </section>
          )}
        </div>
      </Modal>
      {editing && <WorkspacePermissionsModal workspace={editing} onClose={() => setEditing(null)} />}
      <TemporaryPasswordModal
        name={member.full_name}
        mobile={member.mobile}
        password={password}
        onClose={() => setPassword(null)}
      />
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-surface-700 mb-3">{children}</h3>;
}

/** What the person is (doctor / secretary / assistant) and whether they can sign in to this clinic. */
function PersonSection({ member }: { member: StaffMember }) {
  const canUpdate = useCan(CAN.updateStaff);
  const { data: staffTypes = [] } = useStaffTypes();
  const update = useUpdateStaffMember();
  const [form, setForm] = useState({ is_active: member.is_active, staff_types: member.staff_types });

  async function save() {
    try {
      await update.mutateAsync({ membershipId: member.membership_id, changes: form });
      showToast('ذخیره شد');
    } catch (error) {
      showToast(staffErrorMessage(error), 'error');
    }
  }

  return (
    <section>
      <SectionTitle>سمت</SectionTitle>
      <div className="space-y-3">
        <CheckboxList
          options={staffTypes.map((t) => ({ value: t.code, label: t.name }))}
          value={form.staff_types}
          onChange={(staff_types) => setForm({ ...form, staff_types })}
          disabled={!canUpdate}
        />
        <label className="inline-flex items-center gap-2 text-sm text-surface-700">
          <input
            type="checkbox"
            checked={form.is_active}
            disabled={!canUpdate}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          فعال (می‌تواند وارد این کلینیک شود)
        </label>
        {canUpdate && (
          <div>
            <button type="button" onClick={save} disabled={update.isPending} className="btn-secondary text-sm">ذخیره</button>
          </div>
        )}
      </div>
    </section>
  );
}

function DoctorProfileSection({ member }: { member: StaffMember }) {
  const canUpdate = useCan(CAN.updateDoctorProfile);
  const setProfile = useSetDoctorProfile();
  const [form, setForm] = useState({
    medical_license: member.doctor_profile?.medical_license ?? '',
    specialty: member.doctor_profile?.specialty ?? '',
    license_verified: member.doctor_profile?.license_verified ?? false,
  });

  async function save() {
    if (!form.medical_license.trim()) { showToast('شماره نظام پزشکی الزامی است', 'error'); return; }
    try {
      await setProfile.mutateAsync({
        membershipId: member.membership_id,
        profile: { ...form, medical_license: form.medical_license.trim(), specialty: form.specialty.trim() || null },
      });
      showToast('ذخیره شد');
    } catch (error) {
      showToast(staffErrorMessage(error, 'این شماره نظام پزشکی برای پزشک دیگری ثبت شده است'), 'error');
    }
  }

  return (
    <section className="pt-4 border-t border-surface-100">
      <SectionTitle>پروفایل پزشک</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label-field" htmlFor="doctor-license">شماره نظام پزشکی *</label>
          <input
            id="doctor-license"
            className="input-field"
            value={form.medical_license}
            disabled={!canUpdate}
            onChange={(e) => setForm({ ...form, medical_license: e.target.value })}
          />
        </div>
        <div>
          <label className="label-field" htmlFor="doctor-specialty">تخصص</label>
          <input
            id="doctor-specialty"
            className="input-field"
            value={form.specialty}
            disabled={!canUpdate}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          />
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-surface-700 mt-3">
        <input
          type="checkbox"
          checked={form.license_verified}
          disabled={!canUpdate}
          onChange={(e) => setForm({ ...form, license_verified: e.target.checked })}
        />
        شماره نظام پزشکی بررسی شده است
      </label>
      {canUpdate && (
        <div className="mt-3">
          <button type="button" onClick={save} disabled={setProfile.isPending} className="btn-secondary text-sm">ذخیره پروفایل</button>
        </div>
      )}
    </section>
  );
}

/** The person's positions: each with what it may do, on/off and remove; plus adding a position. */
function WorkspacesSection({ member, staff, onEdit }: { member: StaffMember; staff: StaffMember[]; onEdit: (w: Workspace) => void }) {
  const canCreate = useCan(CAN.createWorkspace);
  const canUpdate = useCan(CAN.updateWorkspace);
  const canDelete = useCan(CAN.deleteWorkspace);
  const { workspace: active } = useActiveWorkspace();
  const update = useUpdateWorkspace();
  const remove = useDeleteWorkspace();

  async function setActive(workspace: Workspace, is_active: boolean) {
    try {
      await update.mutateAsync({ id: workspace.id, changes: { is_active } });
    } catch (error) {
      showToast(staffErrorMessage(error), 'error');
    }
  }

  async function removeWorkspace(workspace: Workspace) {
    if (!window.confirm(`جایگاه «${workspace.label}» حذف شود؟`)) return;
    try {
      await remove.mutateAsync(workspace.id);
      showToast('جایگاه حذف شد');
    } catch (error) {
      showToast(staffErrorMessage(error), 'error');
    }
  }

  return (
    <section className="pt-4 border-t border-surface-100">
      <SectionTitle>جایگاه‌ها و دسترسی‌ها</SectionTitle>
      <p className="text-xs text-surface-500 mb-2">
        هر جایگاه دسترسی‌های خودش را دارد. در جایگاه وابسته به یک پزشک فقط نوبت‌ها و بیماران همان پزشک دیده می‌شود.
      </p>
      {member.workspaces.length === 0 && <p className="text-sm text-surface-400">جایگاهی ندارد؛ نمی‌تواند در این کلینیک کار کند.</p>}
      <ul className="divide-y divide-surface-100">
        {member.workspaces.map((w) => (
          <li key={w.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
            <span className={`flex-1 min-w-40 ${w.is_active ? 'text-surface-700' : 'text-surface-400 line-through'}`}>{w.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${w.is_admin || w.permissions.length ? 'bg-primary-50 text-primary-700' : 'bg-warning-50 text-warning-700'}`}>
              {w.is_admin ? 'همه دسترسی‌ها' : w.permissions.length ? `${formatNumber(w.permissions.length)} دسترسی` : 'بدون دسترسی'}
            </span>
            <button type="button" onClick={() => onEdit(w)} className="btn-secondary text-xs px-2 py-1">
              <ShieldCheck size={13} />
              دسترسی‌ها
            </button>
            {canUpdate && w.id !== active?.id && (
              <button type="button" onClick={() => setActive(w, !w.is_active)} disabled={update.isPending} className="text-xs text-primary-600 hover:underline">
                {w.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
              </button>
            )}
            {canDelete && w.id !== active?.id && (
              <button type="button" onClick={() => removeWorkspace(w)} title="حذف جایگاه" className="p-1 rounded-lg text-surface-300 hover:bg-error-50 hover:text-error-500">
                <Trash2 size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {canCreate && <AddPosition member={member} staff={staff} />}
    </section>
  );
}

/** A new staff position (secretary / assistant / ... of a doctor) or a clinic-wide one. It starts with no permissions. */
function AddPosition({ member, staff }: { member: StaffMember; staff: StaffMember[] }) {
  const { data: relationshipTypes = [] } = useRelationshipTypes();
  const create = useCreateWorkspace();
  const [doctorId, setDoctorId] = useState('');
  const [relationship, setRelationship] = useState('');
  const doctors = staff.filter((m) => m.is_active && isDoctor(m) && m.membership_id !== member.membership_id);

  async function add() {
    const wholeClinic = doctorId === 'clinic';
    if (!doctorId || (!wholeClinic && !relationship)) { showToast('پزشک و نوع جایگاه را انتخاب کنید', 'error'); return; }
    try {
      await create.mutateAsync(
        wholeClinic
          ? { membership_id: member.membership_id, kind: 'clinic' }
          : { membership_id: member.membership_id, kind: 'staff', doctor_membership_id: doctorId, relationship_type: relationship },
      );
      setDoctorId('');
      showToast('جایگاه اضافه شد؛ حالا دسترسی‌هایش را بدهید');
    } catch (error) {
      showToast(staffErrorMessage(error), 'error');
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-3">
      <select aria-label="برای" className="input-field sm:flex-1" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
        <option value="">-- جایگاه جدید برای --</option>
        {doctors.map((d) => <option key={d.membership_id} value={d.membership_id}>{d.full_name}</option>)}
        <option value="clinic">کل کلینیک</option>
      </select>
      {doctorId !== 'clinic' && (
        <select aria-label="نوع جایگاه" className="input-field sm:flex-1" value={relationship} onChange={(e) => setRelationship(e.target.value)}>
          <option value="">-- نوع جایگاه --</option>
          {relationshipTypes.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
        </select>
      )}
      <button type="button" onClick={add} disabled={create.isPending} className="btn-secondary text-sm whitespace-nowrap">افزودن جایگاه</button>
    </div>
  );
}
