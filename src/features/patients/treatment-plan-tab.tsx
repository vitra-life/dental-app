import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, Smile, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { JalaliDateInput } from '@/components/ui/jalali-date-input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { planItemStatus, statusStyle, treatmentPlanStatus } from '@/constants/status';
import { formatDate, todayISO } from '@/lib/date';
import { formatCurrency, formatNumber, percent } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Service, TreatmentPlan, TreatmentPlanItem } from '@/lib/types';

export function TreatmentPlanTab({ patientId }: { patientId: string }) {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({ title: '', target_end_date: '', notes: '' });
  const [showItemForm, setShowItemForm] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ service_id: '', tooth_number: '', description: '', estimated_cost: '', due_date: '', notes: '' });

  const load = useCallback(() => {
    const rows = db.orderBy(db.list('treatment_plans', (p) => p.patient_id === patientId), 'created_at', { ascending: false });
    setPlans(db.withMany(rows, 'items', 'treatment_plan_items', 'plan_id').map((plan) => ({
      ...plan,
      items: db.withOne(plan.items, 'service', 'services', 'service_id'),
    })));
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    load();
    setServices(db.list('services', (s) => s.active));
  }, [load]);

  function createPlan() {
    if (!planForm.title) { showToast('عنوان طرح الزامی است', 'error'); return; }
    db.insert('treatment_plans', {
      patient_id: patientId,
      title: planForm.title,
      target_end_date: planForm.target_end_date || null,
      notes: planForm.notes || null,
      total_estimated_cost: 0,
      status: 'active',
    });
    showToast('طرح درمان ایجاد شد');
    setPlanForm({ title: '', target_end_date: '', notes: '' });
    setShowPlanForm(false);
    load();
  }

  function addItem(planId: string) {
    const svc = services.find((s) => s.id === itemForm.service_id);
    const cost = itemForm.estimated_cost ? parseFloat(itemForm.estimated_cost) : svc?.default_price || 0;
    db.insert('treatment_plan_items', {
      plan_id: planId,
      patient_id: patientId,
      service_id: itemForm.service_id || null,
      tooth_number: itemForm.tooth_number ? parseInt(itemForm.tooth_number) : null,
      description: itemForm.description || svc?.name || null,
      estimated_cost: cost,
      due_date: itemForm.due_date || null,
      notes: itemForm.notes || null,
      status: 'planned',
    });

    const plan = plans.find((p) => p.id === planId);
    const newTotal = (plan?.total_estimated_cost || 0) + cost;
    db.update('treatment_plans', planId, { total_estimated_cost: newTotal });

    showToast('آیتم اضافه شد');
    setItemForm({ service_id: '', tooth_number: '', description: '', estimated_cost: '', due_date: '', notes: '' });
    setShowItemForm(null);
    load();
  }

  function updateItemStatus(itemId: string, status: TreatmentPlanItem['status']) {
    const patch: db.Patch<'treatment_plan_items'> = { status };
    if (status === 'completed') patch.completed_date = todayISO();
    db.update('treatment_plan_items', itemId, patch);
    showToast('وضعیت بروزرسانی شد');
    load();
  }

  function deleteItem(itemId: string) {
    db.remove('treatment_plan_items', itemId);
    showToast('آیتم حذف شد');
    load();
  }

  function deletePlan(planId: string) {
    db.remove('treatment_plans', planId);
    showToast('طرح حذف شد');
    load();
  }

  if (loading) return <Skeleton className="h-32" variant="inset" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">{formatNumber(plans.length)} طرح درمان</p>
        <button onClick={() => setShowPlanForm(!showPlanForm)} className="btn-primary">
          <Plus size={16} />
          طرح درمان جدید
        </button>
      </div>

      {showPlanForm && (
        <div className="p-4 bg-surface-50 rounded-xl space-y-3 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label-field">عنوان طرح *</label>
              <input className="input-field" value={planForm.title} onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })} placeholder="مثلا: طرح ایمپلنت فک بالا" />
            </div>
            <div>
              <label className="label-field">تاریخ هدف تکمیل</label>
              <JalaliDateInput value={planForm.target_end_date} onChange={(target_end_date) => setPlanForm({ ...planForm, target_end_date })} />
            </div>
          </div>
          <div>
            <label className="label-field">یادداشت</label>
            <textarea className="input-field min-h-[60px]" value={planForm.notes} onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={createPlan} className="btn-primary">ایجاد طرح</button>
            <button onClick={() => setShowPlanForm(false)} className="btn-secondary">انصراف</button>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <EmptyState icon={ClipboardList} title="هیچ طرح درمانی" description="طرح درمان جدید برای این بیمار ایجاد کنید" />
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const completed = plan.items?.filter((i) => i.status === 'completed').length || 0;
            const total = plan.items?.length || 0;
            const progress = percent(completed, total);
            return (
              <div key={plan.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-surface-800 text-sm">{plan.title}</h4>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {formatNumber(total)} آیتم • {formatCurrency(plan.total_estimated_cost)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={statusStyle(treatmentPlanStatus, plan.status, 'cancelled')} />
                    <button onClick={() => deletePlan(plan.id)} className="p-1.5 rounded-lg hover:bg-error-50">
                      <Trash2 size={14} className="text-surface-400 hover:text-error-500" />
                    </button>
                  </div>
                </div>

                {total > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-surface-400">پیشرفت: {formatNumber(completed)} از {formatNumber(total)}</span>
                      <span className="text-xs font-medium text-primary-600">{formatNumber(progress)}%</span>
                    </div>
                    <ProgressBar value={progress} slow />
                  </div>
                )}

                <div className="space-y-2">
                  {plan.items?.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
                          {item.tooth_number ? <Smile size={16} className="text-primary-500" /> : <ClipboardList size={16} className="text-surface-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-700">
                            {item.service?.name || item.description || 'آیتم'}
                            {item.tooth_number && <span className="text-surface-400"> • دندان {formatNumber(item.tooth_number)}</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-surface-400">{formatCurrency(item.estimated_cost)}</span>
                            {item.due_date && <span className="text-xs text-surface-400">• موعد: {formatDate(item.due_date)}</span>}
                          </div>
                          {item.notes && <p className="text-xs text-surface-500 mt-1">{item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          {item.status === 'planned' && (
                            <button onClick={() => updateItemStatus(item.id, 'in_progress')} className="px-2 py-1 rounded-lg bg-warning-50 text-warning-600 text-xs hover:bg-warning-100">شروع</button>
                          )}
                          {item.status === 'in_progress' && (
                            <button onClick={() => updateItemStatus(item.id, 'completed')} className="px-2 py-1 rounded-lg bg-accent-50 text-accent-600 text-xs hover:bg-accent-100">تکمیل</button>
                          )}
                          <StatusBadge status={statusStyle(planItemStatus, item.status, 'planned')} />
                          <button onClick={() => deleteItem(item.id)} className="p-1 rounded-lg hover:bg-error-50">
                            <Trash2 size={12} className="text-surface-400 hover:text-error-500" />
                          </button>
                        </div>
                      </div>
                  ))}
                </div>

                {showItemForm === plan.id ? (
                  <div className="mt-3 p-4 bg-surface-50 rounded-xl space-y-3 animate-slide-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="label-field">خدمت</label>
                        <select className="input-field" value={itemForm.service_id} onChange={(e) => {
                          const svc = services.find((s) => s.id === e.target.value);
                          setItemForm({ ...itemForm, service_id: e.target.value, estimated_cost: svc ? String(svc.default_price) : itemForm.estimated_cost, description: svc?.name || itemForm.description });
                        }}>
                          <option value="">انتخاب</option>
                          {services.map((s) => <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.default_price)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label-field">شماره دندان</label>
                        <input type="number" className="input-field" value={itemForm.tooth_number} onChange={(e) => setItemForm({ ...itemForm, tooth_number: e.target.value })} />
                      </div>
                      <div>
                        <label className="label-field">هزینه (تومان)</label>
                        <input type="number" className="input-field" value={itemForm.estimated_cost} onChange={(e) => setItemForm({ ...itemForm, estimated_cost: e.target.value })} />
                      </div>
                      <div>
                        <label className="label-field">موعد انجام</label>
                        <JalaliDateInput value={itemForm.due_date} onChange={(due_date) => setItemForm({ ...itemForm, due_date })} />
                      </div>
                    </div>
                    <div>
                      <label className="label-field">توضیحات</label>
                      <input className="input-field" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => addItem(plan.id)} className="btn-primary text-sm">افزودن آیتم</button>
                      <button onClick={() => setShowItemForm(null)} className="btn-secondary text-sm">انصراف</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowItemForm(plan.id)} className="w-full mt-2 py-2 border border-dashed border-surface-200 rounded-xl text-sm text-surface-400 hover:border-primary-300 hover:text-primary-500 transition-colors">
                    <Plus size={14} className="inline ml-1" />
                    افزودن آیتم
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
