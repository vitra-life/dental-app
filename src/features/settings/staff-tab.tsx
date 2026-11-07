import { useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadError } from '@/components/ui/load-error';
import { SkeletonList } from '@/components/ui/skeleton';
import { useCan } from '@/data/session';
import { useStaff, useStaffTypes, type StaffMember } from '@/data/staff';
import { formatNumber, toLatinDigits } from '@/lib/format';
import { CAN } from '@/lib/permissions';
import { StaffDetail } from './staff-detail';
import { StaffForm } from './staff-form';
import { TemporaryPasswordModal } from './temporary-password-modal';

type ActiveFilter = 'active' | 'inactive' | 'all';

const activeFilters: { value: ActiveFilter; label: string }[] = [
  { value: 'active', label: 'فعال' },
  { value: 'inactive', label: 'غیرفعال' },
  { value: 'all', label: 'همه' },
];

/** The clinic's members: who they are, what they do and which roles they hold. */
export function StaffTab() {
  const { data: staff = [], isPending, error, refetch } = useStaff();
  const { data: staffTypes = [] } = useStaffTypes();
  const canManage = useCan(CAN.manageStaff);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ActiveFilter>('active');
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  /** A new account's temporary password, shown once after adding. */
  const [created, setCreated] = useState<{ name: string; mobile: string; password: string } | null>(null);

  const typeName = (code: string) => staffTypes.find((t) => t.code === code)?.name ?? code;
  const open = staff.find((m) => m.membership_id === openId);

  const q = toLatinDigits(search.trim());
  const filtered = staff.filter((m) => {
    if (filter === 'active' && !m.is_active) return false;
    if (filter === 'inactive' && m.is_active) return false;
    return !q || m.full_name.includes(q) || m.mobile.includes(q);
  });

  function onCreated(member: StaffMember & { temporary_password: string | null }) {
    setAdding(false);
    if (member.temporary_password) {
      setCreated({ name: member.full_name, mobile: member.mobile, password: member.temporary_password });
    }
  }

  if (error) return <LoadError error={error} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-surface-700">پرسنل ({formatNumber(staff.filter((m) => m.is_active).length)})</h2>
        {canManage && (
          <button onClick={() => setAdding(true)} className="btn-primary">
            <Plus size={16} />
            عضو جدید
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام یا موبایل..."
            className="input-field pr-9"
          />
        </div>
        <ChoiceChips options={activeFilters} value={filter} onChange={setFilter} />
      </div>

      {isPending ? (
        <div className="space-y-3">
          <SkeletonList count={3} className="h-20" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="عضوی یافت نشد" description="عبارت جستجو یا فیلتر را تغییر دهید" />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <button
              key={m.membership_id}
              type="button"
              onClick={() => setOpenId(m.membership_id)}
              className="card p-4 w-full text-right hover:border-primary-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 rounded-full text-base shrink-0">{m.full_name.trim().charAt(0)}</Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-surface-800">{m.full_name}</span>
                    {!m.is_active && <span className="text-xs bg-surface-100 text-surface-500 px-2 py-0.5 rounded-full">غیرفعال</span>}
                    {m.staff_types.map((t) => (
                      <span key={t} className="text-xs bg-secondary-50 text-secondary-600 px-2 py-0.5 rounded-lg">{typeName(t)}</span>
                    ))}
                  </div>
                  <div className="text-xs text-surface-500 mt-1">
                    <span dir="ltr">{m.mobile}</span>
                    {m.doctor_profile && <> · نظام پزشکی {m.doctor_profile.medical_license}</>}
                  </div>
                </div>
                <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-[40%]">
                  {m.roles.map((r) => (
                    <span key={r.id} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{r.name}</span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {adding && <StaffForm onClose={() => setAdding(false)} onCreated={onCreated} />}
      {open && (
        <StaffDetail key={open.membership_id} member={open} staff={staff} canManage={canManage} onClose={() => setOpenId(null)} />
      )}
      <TemporaryPasswordModal
        name={created?.name ?? ''}
        mobile={created?.mobile ?? ''}
        password={created?.password ?? null}
        onClose={() => setCreated(null)}
      />
    </div>
  );
}
