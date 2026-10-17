import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { formatCurrency, formatNumber } from '@/lib/format';
import { useDeleteService, useServices, useUpdateService } from '@/data/services';
import { ApiError, errorMessage } from '@/lib/api/errors';
import { showToast } from '@/lib/toast';
import type { Service } from '@/lib/types';
import { serviceCategories, serviceCategoryLabel } from '@/constants/service-categories';
import { ServiceForm } from './service-form';

const categoryFilters = [{ value: 'all', label: 'همه' }, ...serviceCategories];

const headers = ['نام خدمت', 'دسته‌بندی', 'قیمت پیش‌فرض', 'مدت زمان', 'وضعیت', ''];

/** The service catalogue: every service with its default price and length. */
export function ServicesTab() {
  const { data: services = [] } = useServices();
  const updateService = useUpdateService();
  const deleteServiceMutation = useDeleteService();
  const [category, setCategory] = useState('all');
  /** The service being edited, `null` while adding one, `undefined` when the dialog is closed. */
  const [editing, setEditing] = useState<Service | null | undefined>(undefined);

  async function toggleActive(service: Service) {
    try {
      await updateService.mutateAsync({ id: service.id, input: { active: !service.active } });
    } catch (error) {
      showToast(errorMessage(error), 'error');
    }
  }

  async function deleteService(id: string) {
    try {
      await deleteServiceMutation.mutateAsync(id);
      showToast('حذف شد');
    } catch (error) {
      const inUse = error instanceof ApiError && error.status === 409;
      showToast(inUse ? 'این خدمت نوبت دارد؛ آن را غیرفعال کنید' : errorMessage(error), 'error');
    }
  }

  const filtered = category === 'all' ? services : services.filter((s) => s.category === category);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-surface-700">کاتالوگ خدمات ({formatNumber(services.length)})</h2>
        <button onClick={() => setEditing(null)} className="btn-primary">
          <Plus size={16} />
          خدمت جدید
        </button>
      </div>

      <ChoiceChips options={categoryFilters} value={category} onChange={setCategory} />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="text-xs font-medium text-surface-500 py-3 px-4 text-right whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((service) => (
                <tr key={service.id} className="border-t border-surface-100 hover:bg-surface-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-surface-800 whitespace-nowrap">{service.name}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full whitespace-nowrap">{serviceCategoryLabel(service.category)}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-surface-700 whitespace-nowrap">{formatCurrency(service.default_price)}</td>
                  <td className="py-3 px-4 text-surface-500 whitespace-nowrap">{formatNumber(service.duration_minutes)} دقیقه</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleActive(service)}
                      className={`text-xs px-2 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${
                        service.active ? 'bg-accent-100 text-accent-700 hover:bg-accent-200' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                      }`}
                    >
                      {service.active ? 'فعال' : 'غیرفعال'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3 justify-end">
                      <button onClick={() => setEditing(service)} className="text-xs text-primary-600 hover:text-primary-700 hover:underline">ویرایش</button>
                      <button onClick={() => deleteService(service.id)} title="حذف" className="p-1 rounded-lg text-surface-300 hover:bg-error-50 hover:text-error-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={headers.length} className="py-8 text-center text-sm text-surface-400">خدمتی در این دسته ثبت نشده است</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== undefined && <ServiceForm service={editing} onClose={() => setEditing(undefined)} onSaved={() => setEditing(undefined)} />}
    </div>
  );
}
