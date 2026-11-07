import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePermissionCatalog } from '@/data/templates';
import { usePermissions } from '@/data/session';
import { formatNumber } from '@/lib/format';
import {
  checkedCount,
  checkGroup,
  groupChecked,
  toggle,
  uncheckGroup,
  type CatalogGroup,
  type Selection,
} from '@/lib/permission-list';

interface PermissionChecklistProps {
  selection: Selection;
  onChange: (selection: Selection) => void;
  readOnly?: boolean;
}

/**
 * Every action of the catalogue, in folding groups, with «انتخاب همه» per
 * group. Items the signed-in workspace doesn't hold are disabled: nobody can
 * grant what they don't have.
 */
export function PermissionChecklist({ selection, onChange, readOnly = false }: PermissionChecklistProps) {
  const { data: catalog = [] } = usePermissionCatalog();
  const { granted: caller } = usePermissions();
  return (
    <div className="space-y-2">
      {catalog.map((group) => (
        <Group key={group.code} group={group} caller={caller} selection={selection} readOnly={readOnly} onChange={onChange} />
      ))}
    </div>
  );
}

interface GroupProps {
  group: CatalogGroup;
  caller: Selection;
  selection: Selection;
  readOnly: boolean;
  onChange: (selection: Selection) => void;
}

function Group({ group, caller, selection, readOnly, onChange }: GroupProps) {
  const [open, setOpen] = useState(false);
  const all = groupChecked(selection, group, caller);
  const count = checkedCount(selection, group);
  const grantable = group.items.some((item) => caller.has(item.code));

  return (
    <div className="border border-surface-200 rounded-xl">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex-1 flex items-center gap-2 text-right text-sm font-semibold text-surface-700"
        >
          <ChevronDown size={15} className={`text-surface-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          {group.label}
          <span className={`text-xs font-normal ${count ? 'text-primary-600' : 'text-surface-400'}`}>
            {formatNumber(count)} از {formatNumber(group.items.length)}
          </span>
        </button>
        {!readOnly && grantable && (
          <button
            type="button"
            onClick={() => onChange(all ? uncheckGroup(selection, group, caller) : checkGroup(selection, group, caller))}
            className="text-xs text-primary-600 hover:underline"
          >
            {all ? 'برداشتن همه' : 'انتخاب همه'}
          </button>
        )}
      </div>
      {open && (
        <div className="border-t border-surface-100 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {group.items.map((item) => {
            const mayChange = !readOnly && caller.has(item.code);
            return (
              <label
                key={item.code}
                title={caller.has(item.code) ? undefined : 'این دسترسی را خودتان ندارید'}
                className={`inline-flex items-center gap-2 text-sm ${mayChange || selection.has(item.code) ? 'text-surface-700' : 'text-surface-400'}`}
              >
                <input
                  type="checkbox"
                  checked={selection.has(item.code)}
                  disabled={!mayChange}
                  onChange={(e) => onChange(toggle(selection, item.code, e.target.checked))}
                />
                {item.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
