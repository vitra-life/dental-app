import { useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { LoadError } from '@/components/ui/load-error';
import { SkeletonList } from '@/components/ui/skeleton';
import { useRoles, type Role } from '@/data/roles';
import { useCan } from '@/data/session';
import { formatNumber } from '@/lib/format';
import { CAN } from '@/lib/permissions';
import { RoleEditor } from './role-editor';

/** What the dialog shows: an existing role, or a new one (empty or copied from another). */
type Editing = { role: Role } | { role: null; startFrom?: Role };

/** The four system roles and the clinic's own, with what each grants. */
export function RolesTab() {
  const { data: roles = [], isPending, error, refetch } = useRoles();
  const canManage = useCan(CAN.manageRoles);
  const [editing, setEditing] = useState<Editing | null>(null);

  if (error) return <LoadError error={error} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-surface-700">نقش‌ها و دسترسی‌ها ({formatNumber(roles.length)})</h2>
        {canManage && (
          <button onClick={() => setEditing({ role: null })} className="btn-primary">
            <Plus size={16} />
            نقش جدید
          </button>
        )}
      </div>

      {isPending ? (
        <div className="space-y-3">
          <SkeletonList count={4} className="h-16" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setEditing({ role })}
              className="card p-4 text-right hover:border-primary-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className={role.is_system ? 'text-surface-400' : 'text-primary-600'} />
                <span className="font-semibold text-surface-800">{role.name}</span>
                {role.is_system && <span className="text-xs bg-surface-100 text-surface-500 px-2 py-0.5 rounded-full">سیستمی</span>}
              </div>
              <p className="text-xs text-surface-500 mt-1">
                {formatNumber(role.member_count)} نفر · {formatNumber(role.permissions.length)} دسترسی
              </p>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <RoleEditor
          key={editing.role ? editing.role.id : `new-${editing.startFrom?.id ?? ''}`}
          role={editing.role}
          startFrom={editing.role ? undefined : editing.startFrom}
          canManage={canManage}
          onClose={() => setEditing(null)}
          onCopy={(role) => setEditing({ role: null, startFrom: role })}
        />
      )}
    </div>
  );
}
