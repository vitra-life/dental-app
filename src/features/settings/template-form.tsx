import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { formatCurrency } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Service, TreatmentPlanTemplate } from '@/lib/types';

interface TemplateFormProps {
  /** The template to edit, or `null` to add one. */
  template: TreatmentPlanTemplate | null;
  services: Service[];
  onClose: () => void;
  onSaved: () => void;
}

export function TemplateForm({ template, services, onClose, onSaved }: TemplateFormProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [active, setActive] = useState(template?.active ?? true);
  const [items, setItems] = useState(template?.items ?? []);
  const [draft, setDraft] = useState({ service_id: '', price: '' });

  function addItem() {
    const service = services.find((s) => s.id === draft.service_id);
    if (!service) return;
    setItems([...items, { service_id: service.id, description: service.name, price: parseFloat(draft.price) || service.default_price }]);
    setDraft({ service_id: '', price: '' });
  }

  function save() {
    if (!name.trim()) { showToast('نام الگو الزامی است', 'error'); return; }
    if (items.length === 0) { showToast('حداقل یک خدمت اضافه کنید', 'error'); return; }
    const values = { name: name.trim(), description: description || null, items, active };
    if (template) {
      db.update('treatment_plan_templates', template.id, values);
      showToast('الگو بروزرسانی شد');
    } else {
      db.insert('treatment_plan_templates', values);
      showToast('الگوی جدید اضافه شد');
    }
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={template ? 'ویرایش الگو' : 'الگوی طرح درمان جدید'} size="md">
      <div className="space-y-4">
        <div>
          <label className="label-field">نام الگو *</label>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: پکیج ایمپلنت استاندارد" />
        </div>
        <div>
          <label className="label-field">توضیحات</label>
          <input className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label-field">افزودن خدمت</label>
          <div className="flex gap-2">
            <select
              className="input-field flex-1 min-w-0"
              value={draft.service_id}
              onChange={(e) => {
                const service = services.find((s) => s.id === e.target.value);
                setDraft({ service_id: e.target.value, price: service ? String(service.default_price) : '' });
              }}
            >
              <option value="">-- خدمت --</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="number" className="input-field w-28" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder="قیمت" />
            <button type="button" onClick={addItem} disabled={!draft.service_id} title="افزودن" className="btn-primary px-3">
              <Plus size={16} />
            </button>
          </div>
        </div>
        {items.length > 0 && (
          <div className="border border-surface-200 rounded-xl overflow-hidden">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-surface-100 text-sm">
                <span className="flex-1 text-surface-700">{item.description}</span>
                <span className="font-medium text-surface-700">{formatCurrency(item.price)}</span>
                <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} title="حذف" className="text-error-400 hover:text-error-600">
                  <X size={16} />
                </button>
              </div>
            ))}
            <div className="px-3 py-2 bg-surface-50 flex justify-between text-sm">
              <span className="text-surface-600">جمع</span>
              <span className="font-bold text-primary-700">{formatCurrency(items.reduce((sum, i) => sum + i.price, 0))}</span>
            </div>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-surface-700 cursor-pointer">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 accent-primary-600" />
          الگو فعال باشد و هنگام ایجاد طرح درمان پیشنهاد شود
        </label>
        <div className="flex gap-2">
          <button onClick={save} className="btn-primary flex-1 py-2.5">ذخیره الگو</button>
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">انصراف</button>
        </div>
      </div>
    </Modal>
  );
}
