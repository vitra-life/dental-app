import { useState } from 'react';
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadError } from '@/components/ui/load-error';
import { SkeletonList } from '@/components/ui/skeleton';
import { AUDIT_PAGE_SIZE, useAuditLogs } from '@/data/audit';
import { formatDate, splitTimestamp } from '@/lib/date';
import { formatNumber, formatTime } from '@/lib/format';

/** The actions the backend records, in Persian. Unknown ones show their code. */
const ACTION_LABELS: Record<string, string> = {
  'membership.created': 'افزودن عضو',
  'membership.updated': 'تغییر دسترسی عضو',
  'staff.password_reset': 'بازنشانی رمز عبور',
  'staff.assigned': 'ثبت ارتباط با پزشک',
  'staff.unassigned': 'حذف ارتباط با پزشک',
  'doctor_profile.updated': 'تغییر پروفایل پزشک',
  'role.created': 'ساخت نقش',
  'role.updated': 'تغییر نام نقش',
  'role.deleted': 'حذف نقش',
  'permission.assigned': 'تغییر دسترسی‌های نقش',
  'client.updated': 'ویرایش بیمار',
  'appointment.cancelled': 'لغو نوبت',
};

const RESOURCE_LABELS: Record<string, string> = {
  membership: 'عضو',
  role: 'نقش',
  staff_assignment: 'ارتباط',
  client: 'بیمار',
  appointment: 'نوبت',
};

const actionOptions = [{ value: '', label: 'همه رویدادها' }, ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }))];

/** Who changed what and when: sensitive changes, newest first. */
export function AuditTab() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const { data, isPending, error, refetch, isPlaceholderData } = useAuditLogs(page, action || null);

  const pages = data ? Math.max(1, Math.ceil(data.total / AUDIT_PAGE_SIZE)) : 1;

  if (error) return <LoadError error={error} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-surface-700">گزارش رویدادها ({formatNumber(data?.total ?? 0)})</h2>
        <select
          aria-label="نوع رویداد"
          className="input-field w-auto"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
        >
          {actionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {isPending ? (
        <div className="space-y-2">
          <SkeletonList count={5} className="h-12" />
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState icon={ScrollText} title="رویدادی ثبت نشده است" description="تغییرات حساس مثل افزودن عضو یا تغییر نقش‌ها اینجا ثبت می‌شوند" />
      ) : (
        <div className={`card overflow-hidden ${isPlaceholderData ? 'opacity-60' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50">
                <tr>
                  {['زمان', 'انجام‌دهنده', 'رویداد', 'مورد'].map((h) => (
                    <th key={h} className="text-right py-3 px-4 text-xs font-medium text-surface-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((entry) => (
                  <tr key={entry.id} className="border-t border-surface-100">
                    <td className="py-3 px-4 text-surface-500 whitespace-nowrap">
                      {formatDate(entry.created_at)} · {formatTime(splitTimestamp(entry.created_at).time)}
                    </td>
                    <td className="py-3 px-4 text-surface-700 whitespace-nowrap">{entry.actor_name}</td>
                    <td className="py-3 px-4 font-medium text-surface-800 whitespace-nowrap">{ACTION_LABELS[entry.action] ?? entry.action}</td>
                    <td className="py-3 px-4 text-surface-500 whitespace-nowrap">
                      {RESOURCE_LABELS[entry.resource_type] ?? entry.resource_type}
                      {entry.resource_id && (
                        <span dir="ltr" className="font-mono text-xs mr-1" title={entry.resource_id}>…{entry.resource_id.slice(-6)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm text-surface-600">
          <button type="button" title="صفحه قبل" disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
          <span>صفحه {formatNumber(page)} از {formatNumber(pages)}</span>
          <button type="button" title="صفحه بعد" disabled={page >= pages} onClick={() => setPage(page + 1)} className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
