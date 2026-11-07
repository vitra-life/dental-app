import { useState } from 'react';
import { CheckboxList } from '@/components/ui/checkbox-list';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Modal } from '@/components/ui/modal';
import { useCreateStaffMember, useStaff, type NewPosition, type StaffMember } from '@/data/staff';
import { toLatinDigits } from '@/lib/format';
import { showToast } from '@/lib/toast';
import { staffErrorMessage } from './staff-messages';

interface StaffFormProps {
  onClose: () => void;
  /** The new member, with `temporary_password` set when a new account was made. */
  onCreated: (member: StaffMember & { temporary_password: string | null }) => void;
}

type Kind = 'doctor' | 'secretary' | 'assistant';

const kinds: { value: Kind; label: string }[] = [
  { value: 'doctor', label: 'پزشک' },
  { value: 'secretary', label: 'منشی' },
  { value: 'assistant', label: 'دستیار' },
];

/** The relationship a secretary or assistant has to the doctors they work for. */
const RELATIONSHIP: Record<Exclude<Kind, 'doctor'>, string> = {
  secretary: 'secretary_of',
  assistant: 'assistant_of',
};

/** "Works for the whole clinic", next to the doctors in the list. */
const WHOLE_CLINIC = 'clinic';

/**
 * Adds someone by mobile with what they are. A doctor gets their own
 * practice workspace; a secretary or assistant gets one workspace per doctor
 * they work for (or a clinic-wide one). Every workspace starts with no
 * permissions; grant them from the person's card.
 */
export function StaffForm({ onClose, onCreated }: StaffFormProps) {
  const { data: staff = [] } = useStaff();
  const createMember = useCreateStaffMember();
  const [form, setForm] = useState({ mobile: '', full_name: '', kind: 'doctor' as Kind, places: [] as string[] });
  const doctors = staff.filter((m) => m.is_active && m.staff_types.includes('doctor'));

  async function save() {
    const mobile = toLatinDigits(form.mobile).replace(/\s/g, '');
    if (!/^09\d{9}$/.test(mobile)) { showToast('شماره موبایل معتبر نیست (مانند ۰۹۱۲۱۲۳۴۵۶۷)', 'error'); return; }
    if (!form.full_name.trim()) { showToast('نام و نام خانوادگی الزامی است', 'error'); return; }
    if (form.kind !== 'doctor' && form.places.length === 0) {
      showToast('مشخص کنید برای کدام پزشک (یا کل کلینیک) کار می‌کند', 'error');
      return;
    }
    const positions: NewPosition[] =
      form.kind === 'doctor'
        ? []
        : form.places.map((place) =>
            place === WHOLE_CLINIC
              ? { kind: 'clinic' }
              : { kind: 'staff', doctor_membership_id: place, relationship_type: RELATIONSHIP[form.kind as Exclude<Kind, 'doctor'>] },
          );
    try {
      const member = await createMember.mutateAsync({
        mobile,
        full_name: form.full_name.trim(),
        staff_types: [form.kind],
        positions,
      });
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
          <span className="label-field">سمت *</span>
          <ChoiceChips options={kinds} value={form.kind} onChange={(kind) => setForm({ ...form, kind, places: [] })} />
        </div>
        {form.kind === 'doctor' ? (
          <p className="text-xs text-surface-500">برای پزشک جایگاه «مطب خودم» ساخته می‌شود.</p>
        ) : (
          <div>
            <span className="label-field">برای چه کسی کار می‌کند؟ *</span>
            <CheckboxList
              options={[
                ...doctors.map((d) => ({ value: d.membership_id, label: d.full_name })),
                { value: WHOLE_CLINIC, label: 'کل کلینیک' },
              ]}
              value={form.places}
              onChange={(places) => setForm({ ...form, places })}
            />
            <p className="text-xs text-surface-500 mt-2">برای هر انتخاب یک جایگاه جدا ساخته می‌شود.</p>
          </div>
        )}
        <p className="text-xs text-warning-600">جایگاه‌های جدید هیچ دسترسی ندارند؛ بعد از افزودن، دسترسی‌ها را بدهید.</p>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={createMember.isPending} className="btn-primary flex-1">افزودن</button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">انصراف</button>
        </div>
      </form>
    </Modal>
  );
}
