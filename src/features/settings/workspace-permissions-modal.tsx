import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useCan } from '@/data/session';
import { useSetWorkspacePermissions, type Workspace } from '@/data/staff';
import { usePermissionCatalog, useTemplates } from '@/data/templates';
import { CAN } from '@/lib/permissions';
import { inCatalogOrder, type Selection } from '@/lib/permission-list';
import { showToast } from '@/lib/toast';
import { PermissionChecklist } from './permission-checklist';
import { staffErrorMessage } from './staff-messages';

interface WorkspacePermissionsModalProps {
  workspace: Workspace;
  onClose: () => void;
}

/** What one workspace may do: the catalogue as a checklist, with «fill from a template». */
export function WorkspacePermissionsModal({ workspace, onClose }: WorkspacePermissionsModalProps) {
  const canEdit = useCan(CAN.updateWorkspace) && !workspace.is_admin;
  const canUseTemplates = useCan(CAN.viewTemplates);
  const { data: catalog = [] } = usePermissionCatalog();
  const { data: templates = [] } = useTemplates({ enabled: canEdit && canUseTemplates });
  const save = useSetWorkspacePermissions();
  const [selection, setSelection] = useState<Selection>(() => new Set(workspace.permissions));

  function fillFrom(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (template) setSelection(new Set([...selection, ...template.permissions]));
  }

  async function submit() {
    try {
      await save.mutateAsync({ id: workspace.id, permissions: inCatalogOrder(catalog, selection) });
      showToast('دسترسی‌ها ذخیره شد');
      onClose();
    } catch (error) {
      showToast(staffErrorMessage(error), 'error');
    }
  }

  return (
    <Modal open onClose={onClose} title={`دسترسی‌های ${workspace.member_name} · ${workspace.label}`} size="xl">
      <div className="space-y-4">
        {workspace.is_admin ? (
          <p className="p-3 rounded-xl bg-surface-50 text-sm text-surface-600">جایگاه مدیر کلینیک همه دسترسی‌ها را دارد.</p>
        ) : (
          <>
            {selection.size === 0 && (
              <p className="flex items-center gap-2 p-3 rounded-xl bg-warning-50 text-sm text-warning-700">
                <AlertTriangle size={16} className="shrink-0" />
                این جایگاه هنوز هیچ دسترسی ندارد؛ این فرد در آن کاری نمی‌تواند بکند.
              </p>
            )}
            {canEdit && canUseTemplates && templates.length > 0 && (
              <select
                aria-label="پر کردن از الگو"
                className="input-field w-auto"
                value=""
                onChange={(e) => fillFrom(e.target.value)}
              >
                <option value="">پر کردن از الگو…</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
            <PermissionChecklist selection={selection} onChange={setSelection} readOnly={!canEdit} />
          </>
        )}
        <div className="flex gap-3 pt-2">
          {canEdit && (
            <button type="button" onClick={submit} disabled={save.isPending} className="btn-primary flex-1">ذخیره</button>
          )}
          <button type="button" onClick={onClose} className="btn-secondary flex-1">{canEdit ? 'انصراف' : 'بستن'}</button>
        </div>
      </div>
    </Modal>
  );
}
