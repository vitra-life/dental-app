import { useState } from 'react';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { LoadError } from '@/components/ui/load-error';
import { Modal } from '@/components/ui/modal';
import { SkeletonList } from '@/components/ui/skeleton';
import { useCan } from '@/data/session';
import {
  useCreateTemplate,
  useDeleteTemplate,
  usePermissionCatalog,
  useTemplates,
  useUpdateTemplate,
  type PermissionTemplate,
} from '@/data/templates';
import { formatNumber } from '@/lib/format';
import { CAN } from '@/lib/permissions';
import { inCatalogOrder, type Selection } from '@/lib/permission-list';
import { showToast } from '@/lib/toast';
import { PermissionChecklist } from './permission-checklist';
import { staffErrorMessage } from './staff-messages';

/**
 * Reusable sets of permissions, e.g. «منشی استاندارد». Applying one fills a
 * workspace's checklist; the workspace keeps its own copy, so editing or
 * deleting a template never changes anyone's access.
 */
export function TemplatesTab() {
  const { data: templates = [], isPending, error, refetch } = useTemplates();
  const canCreate = useCan(CAN.createTemplate);
  /** The template being edited, `null` while adding one, `undefined` when closed. */
  const [editing, setEditing] = useState<PermissionTemplate | null | undefined>(undefined);

  if (error) return <LoadError error={error} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-surface-700">الگوهای دسترسی ({formatNumber(templates.length)})</h2>
        {canCreate && (
          <button onClick={() => setEditing(null)} className="btn-primary">
            <Plus size={16} />
            الگوی جدید
          </button>
        )}
      </div>
      <p className="text-xs text-surface-500">
        با «پر کردن از الگو» در دسترسی‌های هر جایگاه، موارد الگو یک‌جا تیک می‌خورند. تغییر یا حذف الگو دسترسی کسی را تغییر نمی‌دهد.
      </p>

      {isPending ? (
        <div className="space-y-3">
          <SkeletonList count={3} className="h-16" />
        </div>
      ) : templates.length === 0 ? (
        <p className="text-sm text-surface-400">هنوز الگویی ساخته نشده است.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <button key={t.id} type="button" onClick={() => setEditing(t)} className="card p-4 text-right hover:border-primary-200 transition-colors">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary-600" />
                <span className="font-semibold text-surface-800">{t.name}</span>
              </div>
              <p className="text-xs text-surface-500 mt-1">{formatNumber(t.permissions.length)} دسترسی</p>
            </button>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <TemplateEditor key={editing?.id ?? 'new'} template={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}

function TemplateEditor({ template, onClose }: { template: PermissionTemplate | null; onClose: () => void }) {
  const canSave = useCan(template ? CAN.updateTemplate : CAN.createTemplate);
  const canDelete = useCan(CAN.deleteTemplate);
  const { data: catalog = [] } = usePermissionCatalog();
  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const remove = useDeleteTemplate();
  const [name, setName] = useState(template?.name ?? '');
  const [code, setCode] = useState(template?.code ?? '');
  const [selection, setSelection] = useState<Selection>(() => new Set(template?.permissions));

  async function save() {
    if (!name.trim()) { showToast('نام الگو الزامی است', 'error'); return; }
    if (!template && !/^[a-z][a-z0-9_]{1,63}$/.test(code)) {
      showToast('کد الگو با حرف کوچک انگلیسی شروع شود و فقط حروف، رقم و _ داشته باشد', 'error');
      return;
    }
    const permissions = inCatalogOrder(catalog, selection);
    try {
      if (template) await update.mutateAsync({ id: template.id, name: name.trim(), permissions });
      else await create.mutateAsync({ code, name: name.trim(), permissions });
      showToast('ذخیره شد');
      onClose();
    } catch (error) {
      showToast(staffErrorMessage(error, 'الگویی با این کد وجود دارد'), 'error');
    }
  }

  async function deleteTemplate() {
    if (!template || !window.confirm(`الگوی «${template.name}» حذف شود؟`)) return;
    try {
      await remove.mutateAsync(template.id);
      showToast('حذف شد');
      onClose();
    } catch (error) {
      showToast(staffErrorMessage(error), 'error');
    }
  }

  return (
    <Modal open onClose={onClose} title={template ? template.name : 'الگوی جدید'} size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label-field" htmlFor="template-name">نام الگو *</label>
            <input id="template-name" className="input-field" value={name} disabled={!canSave} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label-field" htmlFor="template-code">کد (انگلیسی) *</label>
            <input
              id="template-code"
              dir="ltr"
              className="input-field text-left"
              placeholder="front_desk"
              value={code}
              disabled={!canSave || template !== null}
              onChange={(e) => setCode(e.target.value.toLowerCase())}
            />
          </div>
        </div>
        <PermissionChecklist selection={selection} onChange={setSelection} readOnly={!canSave} />
        <div className="flex flex-wrap gap-3 pt-2">
          {canSave && <button type="button" onClick={save} disabled={create.isPending || update.isPending} className="btn-primary flex-1">ذخیره</button>}
          {template && canDelete && (
            <button type="button" onClick={deleteTemplate} disabled={remove.isPending} className="btn-secondary text-error-600">
              <Trash2 size={15} />
              حذف الگو
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-secondary flex-1">{canSave ? 'انصراف' : 'بستن'}</button>
        </div>
      </div>
    </Modal>
  );
}
