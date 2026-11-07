import { useState } from 'react';
import { CheckboxList } from '@/components/ui/checkbox-list';
import { Modal } from '@/components/ui/modal';
import { useRoles } from '@/data/roles';
import { useCreateStaffMember, useStaffTypes, type StaffMember } from '@/data/staff';
import { toLatinDigits } from '@/lib/format';
import { showToast } from '@/lib/toast';
import { staffErrorMessage } from './staff-messages';

interface StaffFormProps {
  onClose: () => void;
  /** The new member, with `temporary_password` set when a new account was made. */
  onCreated: (member: StaffMember & { temporary_password: string | null }) => void;
}

/** Adds someone to the clinic by mobile, with their staff types and roles. */
export function StaffForm({ onClose, onCreated }: StaffFormProps) {
  const { data: staffTypes = [] } = useStaffTypes();
  const { data: roles = [] } = useRoles();
  const createMember = useCreateStaffMember();
  const [form, setForm] = useState({ mobile: '', full_name: '', staff_types: [] as string[], role_ids: [] as string[] });

  async function save() {
    const mobile = toLatinDigits(form.mobile).replace(/\s/g, '');
    if (!/^09\d{9}$/.test(mobile)) { showToast('شماره موبایل معتبر نیست (مانند ۰۹۱۲۱۲۳۴۵۶۷)', 'error'); return; }
    if (!form.full_name.trim()) { showToast('نام و نام خانوادگی الزامی است', 'error'); return; }
    if (form.role_ids.length === 0) { showToast('حداقل یک نقش انتخاب کنید', 'error'); return; }
    try {
      const member = await createMember.mutateAsync({ ...form, mobile, full_name: form.full_name.trim() });
      showToast(member.temporary_password ? 'عضو جدید اضافه شد' : 'با حساب موجودش به کلینیک اضافه شد');
      onCreated(member);
    } catch (error) {
      showToast(staffErrorMessage(error, 'این فرد از قبل عضو کلینیک است'), 'error');
    }
  }

  return (
    <Modal open onClose={onClose} title="عضو جدید">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label-field" htmlFor="staff-mobile">شماره موبایل *</label>
            <input
              id="staff-mobile"
              dir="ltr"
              inputMode="tel"
              className="input-field text-left"
              placeholder="۰۹۱۲۱۲۳۴۵۶۷"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field" htmlFor="staff-name">نام و نام خانوادگی *</label>
            <input
              id="staff-name"
              className="input-field"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
        </div>
        <p className="text-xs text-surface-500 -mt-2">
          اگر این شماره در ویترا حساب داشته باشد، با همان حساب و رمز فعلی‌اش اضافه می‌شود.
        </p>
        <div>
          <span className="label-field">سمت</span>
          <CheckboxList
            options={staffTypes.map((t) => ({ value: t.code, label: t.name }))}
            value={form.staff_types}
            onChange={(staff_types) => setForm({ ...form, staff_types })}
          />
        </div>
        <div>
          <span className="label-field">نقش‌ها *</span>
          <CheckboxList
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            value={form.role_ids}
            onChange={(role_ids) => setForm({ ...form, role_ids })}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={createMember.isPending} className="btn-primary flex-1">افزودن</button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">انصراف</button>
        </div>
      </form>
    </Modal>
  );
}
