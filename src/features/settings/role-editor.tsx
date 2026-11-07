import { useMemo, useState } from 'react';
import { ChevronDown, Copy, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useCreateRole, useDeleteRole, usePermissionCatalog, useUpdateRole, type Role } from '@/data/roles';
import { usePermissions } from '@/data/session';
import { formatNumber } from '@/lib/format';
import {
  allChecked,
  canGrant,
  check,
  checkAll,
  fromGrants,
  grantableScopes,
  indexCatalog,
  SCOPES,
  setScope,
  toGrants,
  uncheck,
  type CatalogIndex,
  type CatalogNode,
  type Scope,
  type Selection,
} from '@/lib/permission-tree';
import { showToast } from '@/lib/toast';
import { staffErrorMessage } from './staff-messages';

interface RoleEditorProps {
  /** The role to edit or view; `null` for a new role. */
  role: Role | null;
  /** For a new role: grants to start from (a copied role). */
  startFrom?: Role;
  canManage: boolean;
  onClose: () => void;
  /** Starts a new role from this (system) role's grants. */
  onCopy: (role: Role) => void;
}

/** A role's name and its grants, chosen from the permission catalogue. System roles are read-only. */
export function RoleEditor({ role, startFrom, canManage, onClose, onCopy }: RoleEditorProps) {
  const { data: catalog = [] } = usePermissionCatalog();
  const { scopes: caller } = usePermissions();
  const index = useMemo(() => indexCatalog(catalog), [catalog]);
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const readOnly = !canManage || (role?.is_system ?? false);
  const [name, setName] = useState(role?.name ?? (startFrom ? `${startFrom.name} (کپی)` : ''));
  const [code, setCode] = useState(startFrom ? `${startFrom.code}_copy` : '');
  const [selection, setSelection] = useState<Selection>(() =>
    fromGrants((role ?? startFrom)?.permissions ?? []),
  );
  const saving = createRole.isPending || updateRole.isPending;

  async function save() {
    if (!name.trim()) { showToast('نام نقش الزامی است', 'error'); return; }
    if (!role && !/^[a-z][a-z0-9_]{1,63}$/.test(code)) {
      showToast('کد نقش با حرف کوچک انگلیسی شروع شود و فقط حروف، رقم و _ داشته باشد', 'error');
      return;
    }
    const permissions = toGrants(index, selection);
    try {
      if (role) await updateRole.mutateAsync({ id: role.id, name: name.trim(), permissions });
      else await createRole.mutateAsync({ code, name: name.trim(), permissions });
      showToast('ذخیره شد');
      onClose();
    } catch (error) {
      showToast(staffErrorMessage(error, 'نقشی با این کد وجود دارد'), 'error');
    }
  }

  async function remove() {
    if (!role || !window.confirm(`نقش «${role.name}» حذف شود؟`)) return;
    try {
      await deleteRole.mutateAsync(role.id);
      showToast('حذف شد');
      onClose();
    } catch (error) {
      showToast(staffErrorMessage(error, `این نقش به ${formatNumber(role.member_count)} نفر داده شده؛ ابتدا آن را از آن‌ها بگیرید`), 'error');
    }
  }

  const title = role ? (role.is_system ? `${role.name} (نقش سیستمی)` : role.name) : 'نقش جدید';

  return (
    <Modal open onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        {role?.is_system && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-surface-50 text-sm text-surface-600">
            <span>نقش‌های سیستمی قابل تغییر نیستند.</span>
            {canManage && (
              <button type="button" onClick={() => onCopy(role)} className="btn-secondary text-xs">
                <Copy size={14} />
                کپی به عنوان نقش جدید
              </button>
            )}
          </div>
        )}
        {!role?.is_system && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-field" htmlFor="role-name">نام نقش *</label>
              <input id="role-name" className="input-field" value={name} disabled={readOnly} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label-field" htmlFor="role-code">کد (انگلیسی) *</label>
              <input
                id="role-code"
                dir="ltr"
                className="input-field text-left"
                placeholder="senior_secretary"
                value={role ? role.code : code}
                disabled={readOnly || role !== null}
                onChange={(e) => setCode(e.target.value.toLowerCase())}
              />
            </div>
          </div>
        )}

        <p className="text-xs text-surface-500">
          هر مورد زیرمجموعه بدون صفحه‌اش کار نمی‌کند، پس با انتخاب آن صفحه‌اش هم انتخاب می‌شود. مواردی را که خودتان ندارید نمی‌توانید بدهید.
        </p>

        <div className="space-y-2">
          {catalog.map((page) => (
            <PageGroup
              key={page.code}
              page={page}
              index={index}
              caller={caller}
              selection={selection}
              readOnly={readOnly}
              onChange={setSelection}
            />
          ))}
        </div>

        {!readOnly && (
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={save} disabled={saving} className="btn-primary flex-1">ذخیره</button>
            {role && (
              <button type="button" onClick={remove} disabled={deleteRole.isPending} className="btn-secondary text-error-600">
                <Trash2 size={15} />
                حذف نقش
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-secondary flex-1">انصراف</button>
          </div>
        )}
      </div>
    </Modal>
  );
}

interface TreeProps {
  index: CatalogIndex;
  caller: ReadonlyMap<string, Scope>;
  selection: Selection;
  readOnly: boolean;
  onChange: (selection: Selection) => void;
}

/** One page of the catalogue, folded until opened, with its features and actions. */
function PageGroup({ page, ...tree }: TreeProps & { page: CatalogNode }) {
  const [open, setOpen] = useState(false);
  const { index, caller, selection, readOnly, onChange } = tree;
  const chosen = page.children.length > 0 ? countChosen(page, selection) : null;

  return (
    <div className="border border-surface-200 rounded-xl">
      <div className="flex items-center gap-2 p-3">
        <Item node={page} {...tree} />
        {page.children.length > 0 && (
          <>
            {!readOnly && !allChecked(index, caller, selection, page.code) && (
              <button type="button" onClick={() => onChange(checkAll(index, caller, selection, page.code))} className="text-xs text-primary-600 hover:underline">
                انتخاب همه
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              className="inline-flex items-center gap-1 text-xs text-surface-500 hover:text-surface-700"
            >
              {formatNumber(chosen ?? 0)} از {formatNumber(descendantCount(page))}
              <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          </>
        )}
      </div>
      {open && (
        <div className="border-t border-surface-100 p-3 space-y-2">
          {page.children.map((feature) => (
            <div key={feature.code}>
              <Item node={feature} {...tree} />
              {feature.children.length > 0 && (
                <div className="mr-6 mt-1 space-y-1">
                  {feature.children.map((action) => <Item key={action.code} node={action} {...tree} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** A checkbox for one catalogue item, and a scope select when it touches data. */
function Item({ node, index, caller, selection, readOnly, onChange }: TreeProps & { node: CatalogNode }) {
  const checked = selection.has(node.code);
  const grantable = canGrant(index, caller, node.code);
  const scopes = grantableScopes(caller, node.code);
  const scope = selection.get(node.code);

  return (
    <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
      <label className={`inline-flex items-center gap-2 text-sm ${grantable || checked ? 'text-surface-700' : 'text-surface-400'} ${node.kind === 'page' ? 'font-semibold' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          disabled={readOnly || (!grantable && !checked)}
          onChange={(e) =>
            onChange(e.target.checked ? check(index, caller, selection, node.code) : uncheck(index, selection, node.code))
          }
        />
        {node.label}
      </label>
      {node.scoped && checked && scope && (
        <select
          aria-label={`دامنه ${node.label}`}
          className="input-field w-auto py-1 text-xs"
          value={scope}
          disabled={readOnly}
          onChange={(e) => onChange(setScope(selection, node.code, e.target.value as Scope))}
        >
          {SCOPES.filter((s) => scopes.includes(s.value) || s.value === scope).map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}

const descendantCount = (node: CatalogNode): number =>
  node.children.reduce((sum, child) => sum + 1 + descendantCount(child), 0);

const countChosen = (node: CatalogNode, selection: Selection): number =>
  node.children.reduce((sum, child) => sum + (selection.has(child.code) ? 1 : 0) + countChosen(child, selection), 0);
