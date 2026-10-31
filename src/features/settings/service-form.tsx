import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { NumberInput } from '@/components/ui/number-input';
import { useCreateService, useUpdateService } from '@/data/services';
import { ApiError, errorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';
import type { Service } from '@/lib/types';
import { serviceCategories } from '@/constants/service-categories';

interface ServiceFormProps {
  /** The service to edit, or `null` to add one. */
  service: Service | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ServiceForm({ service, onClose, onSaved }: ServiceFormProps) {
  const [form, setForm] = useState({
    name: service?.name ?? '',
    category: service?.category ?? 'general',
    /** `null` while the field is empty; an empty price saves as 0. */
    default_price: service ? service.default_price : (null as number | null),
    duration_minutes: (service?.duration_minutes ?? 30) as number | null,
    description: service?.description ?? '',
  });

  const createService = useCreateService();
  const updateService = useUpdateService();
  const saving = createService.isPending || updateService.isPending;

  async function save() {
    if (!form.name.trim()) { showToast('نام خدمت الزامی است', 'error'); return; }
    if (form.duration_minutes === null) { showToast('مدت خدمت را وارد کنید', 'error'); return; }
    const values = {
      ...form,
      name: form.name.trim(),
      default_price: form.default_price ?? 0,
      duration_minutes: form.duration_minutes,
      description: form.description || null,
    };
    try {
      if (service) {
        await updateService.mutateAsync({ id: service.id, input: values });
        showToast('خدمت بروزرسانی شد');
      } else {
        await createService.mutateAsync({ ...values, active: true });
        showToast('خدمت جدید اضافه شد');
      }
      onSaved();
    } catch (error) {
      const duplicate = error instanceof ApiError && error.status === 409;
      const badDuration = error instanceof ApiError && error.fieldErrors.some((e) => e.field === 'duration_minutes');
      showToast(
        duplicate ? 'خدمتی با این نام قبلا ثبت شده است' : badDuration ? 'مدت باید بین ۵ تا ۴۸۰ دقیقه باشد' : errorMessage(error),
        'error',
      );
    }
  }

  return (
    <Modal open onClose={onClose} title={service ? 'ویرایش خدمت' : 'افزودن خدمت جدید'} size="sm">
      <div className="space-y-3">
        <div>
          <label className="label-field">نام خدمت *</label>
          <input className="input-field py-2.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">دسته‌بندی</label>
            <select className="input-field py-2.5" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {serviceCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">مدت (دقیقه)</label>
            <NumberInput className="input-field py-2.5" value={form.duration_minutes} onChange={(duration_minutes) => setForm({ ...form, duration_minutes })} />
          </div>
        </div>
        <div>
          <label className="label-field">قیمت پیش‌فرض (تومان)</label>
          <NumberInput className="input-field py-2.5" value={form.default_price} onChange={(default_price) => setForm({ ...form, default_price })} placeholder="0" />
        </div>
        <div>
          <label className="label-field">توضیحات</label>
          <input className="input-field py-2.5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={saving} className="btn-primary flex-1 py-2.5">{saving ? 'در حال ذخیره...' : 'ذخیره'}</button>
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5">انصراف</button>
        </div>
      </div>
    </Modal>
  );
}
