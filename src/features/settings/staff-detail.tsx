import { useState } from 'react';
import { KeyRound, Trash2 } from 'lucide-react';
import { CheckboxList } from '@/components/ui/checkbox-list';
import { Modal } from '@/components/ui/modal';
import { useRoles } from '@/data/roles';
import {
  useCreateStaffAssignment,
  useDeleteStaffAssignment,
  useRelationshipTypes,
  useResetStaffPassword,
  useSetDoctorProfile,
  useStaffAssignments,
  useStaffTypes,
  useUpdateStaffMember,
  type StaffMember,
} from '@/data/staff';
import { showToast } from '@/lib/toast';
import { staffErrorMessage } from './staff-messages';
import { TemporaryPasswordModal } from './temporary-password-modal';

interface StaffDetailProps {
  member: StaffMember;
  /** All members, for choosing the doctors this member works for. */
  staff: StaffMember[];
  /** Without `settings.staff.manage` everything is read-only. */
  canManage: boolean;
  onClose: () => void;
}

const isDoctor = (m: StaffMember) => m.staff_types.includes('doctor');

/** One member: access (staff types, roles, active), doctor profile, links to doctors, password reset. */
export function StaffDetail({ member, staff, canManage, onClose }: StaffDetailProps) {
  const [password, setPassword] = useState<string | null>(null);
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
      <Modal open={password === null} onClose={onClose} title={member.full_name} size="lg">
        <div className="space-y-6">
          <p className="text-sm text-surface-500 -mt-2" dir="ltr" style={{ textAlign: 'right' }}>
            {member.mobile}
          </p>
          <AccessSection member={member} canManage={canManage} />
          {isDoctor(member) && <DoctorProfileSection member={member} canManage={canManage} />}
          <LinksSection member={member} staff={staff} canManage={canManage} />
          {canManage && (
            <section className="pt-4 border-t border-surface-100">
              <button type="button" onClick={reset} disabled={resetPassword.isPending} className="btn-secondary text-sm">
                <KeyRound size={15} />
                بازنشانی رمز عبور
              </button>
            </section>
          )}
        </div>
      </Modal>
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

function AccessSection({ member, canManage }: { member: StaffMember; canManage: boolean }) {
  const { data: staffTypes = [] } = useStaffTypes();
  const { data: roles = [] } = useRoles();
  const update = useUpdateStaffMember();
  const [form, setForm] = useState({
    is_active: member.is_active,
    staff_types: member.staff_types,
    role_ids: member.roles.map((r) => r.id),
  });

  async function save() {
    if (form.role_ids.length === 0) { showToast('حداقل یک نقش انتخاب کنید', 'error'); return; }
    try {
      await update.mutateAsync({ membershipId: member.membership_id, changes: form });
      showToast('ذخیره شد');
    } catch (error) {
      showToast(staffErrorMessage(error), 'error');
    }
  }

  return (
    <section>
      <SectionTitle>دسترسی</SectionTitle>
      <div className="space-y-3">
        <div>
          <span className="label-field">سمت</span>
          <CheckboxList
            options={staffTypes.map((t) => ({ value: t.code, label: t.name }))}
            value={form.staff_types}
            onChange={(staff_types) => setForm({ ...form, staff_types })}
            disabled={!canManage}
          />
        </div>
        <div>
          <span className="label-field">نقش‌ها</span>
          <CheckboxList
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            value={form.role_ids}
            onChange={(role_ids) => setForm({ ...form, role_ids })}
            disabled={!canManage}
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-surface-700">
          <input
            type="checkbox"
            checked={form.is_active}
            disabled={!canManage}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          فعال (می‌تواند وارد این کلینیک شود)
        </label>
        {canManage && (
          <div>
            <button type="button" onClick={save} disabled={update.isPending} className="btn-primary text-sm">ذخیره دسترسی</button>
          </div>
        )}
      </div>
    </section>
  );
}

function DoctorProfileSection({ member, canManage }: { member: StaffMember; canManage: boolean }) {
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
            disabled={!canManage}
            onChange={(e) => setForm({ ...form, medical_license: e.target.value })}
          />
        </div>
        <div>
          <label className="label-field" htmlFor="doctor-specialty">تخصص</label>
          <input
            id="doctor-specialty"
            className="input-field"
            value={form.specialty}
            disabled={!canManage}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          />
        </div>
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-surface-700 mt-3">
        <input
          type="checkbox"
          checked={form.license_verified}
          disabled={!canManage}
          onChange={(e) => setForm({ ...form, license_verified: e.target.checked })}
        />
        شماره نظام پزشکی بررسی شده است
      </label>
      {canManage && (
        <div className="mt-3">
          <button type="button" onClick={save} disabled={setProfile.isPending} className="btn-secondary text-sm">ذخیره پروفایل</button>
        </div>
      )}
    </section>
  );
}

function LinksSection({ member, staff, canManage }: { member: StaffMember; staff: StaffMember[]; canManage: boolean }) {
  const { data: assignments = [] } = useStaffAssignments();
  const { data: relationshipTypes = [] } = useRelationshipTypes();
  const create = useCreateStaffAssignment();
  const remove = useDeleteStaffAssignment();
  const [doctorId, setDoctorId] = useState('');
  const [relationship, setRelationship] = useState('');

  const worksFor = assignments.filter((a) => a.staff_membership_id === member.membership_id);
  const team = assignments.filter((a) => a.doctor_membership_id === member.membership_id);
  const doctors = staff.filter((m) => m.is_active && isDoctor(m) && m.membership_id !== member.membership_id);

  async function add() {
    if (!doctorId || !relationship) { showToast('پزشک و نوع ارتباط را انتخاب کنید', 'error'); return; }
    try {
      await create.mutateAsync({
        staff_membership_id: member.membership_id,
        doctor_membership_id: doctorId,
        relationship_type: relationship,
      });
      setDoctorId('');
      showToast('ارتباط ثبت شد');
    } catch (error) {
      showToast(staffErrorMessage(error, 'این ارتباط از قبل ثبت شده است'), 'error');
    }
  }

  async function unlink(id: string) {
    try {
      await remove.mutateAsync(id);
      showToast('ارتباط حذف شد');
    } catch (error) {
      showToast(staffErrorMessage(error), 'error');
    }
  }

  const row = (id: string, text: string) => (
    <li key={id} className="flex items-center justify-between gap-2 py-2 text-sm text-surface-700">
      <span>{text}</span>
      {canManage && (
        <button type="button" onClick={() => unlink(id)} title="حذف ارتباط" className="p-1 rounded-lg text-surface-300 hover:bg-error-50 hover:text-error-500">
          <Trash2 size={14} />
        </button>
      )}
    </li>
  );

  return (
    <section className="pt-4 border-t border-surface-100">
      <SectionTitle>ارتباط با پزشکان</SectionTitle>
      <p className="text-xs text-surface-500 mb-2">
        نقش‌هایی با دسترسی «خودش و پزشکان مرتبط» نوبت‌ها و بیماران همین پزشکان را می‌بینند.
      </p>
      {worksFor.length === 0 && team.length === 0 && <p className="text-sm text-surface-400">ارتباطی ثبت نشده است</p>}
      <ul className="divide-y divide-surface-100">
        {worksFor.map((a) => row(a.id, `${a.relationship_name}: ${a.doctor_name}`))}
        {team.map((a) => row(a.id, `${a.staff_name} (${a.relationship_name})`))}
      </ul>
      {canManage && doctors.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <select className="input-field sm:flex-1" value={relationship} onChange={(e) => setRelationship(e.target.value)}>
            <option value="">-- نوع ارتباط --</option>
            {relationshipTypes.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
          </select>
          <select className="input-field sm:flex-1" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="">-- پزشک --</option>
            {doctors.map((d) => <option key={d.membership_id} value={d.membership_id}>{d.full_name}</option>)}
          </select>
          <button type="button" onClick={add} disabled={create.isPending} className="btn-secondary text-sm whitespace-nowrap">افزودن</button>
        </div>
      )}
    </section>
  );
}
