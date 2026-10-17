import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { JalaliDateInput } from '@/components/ui/jalali-date-input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { NumberInput } from '@/components/ui/number-input';
import { planItemStatus, statusStyle, treatmentPlanStatus } from '@/constants/status';
import { formatDate, todayISO } from '@/lib/date';
import { formatCurrency, formatNumber, percent } from '@/lib/format';
import { useServices } from '@/data/services';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import { createPlanFromTemplate } from '@/lib/treatment-plans';
import type { TreatmentPlan, TreatmentPlanItem, TreatmentPlanTemplate } from '@/lib/types';

export function TreatmentPlanTab({ patientId }: { patientId: string }) {
  const [planRows, setPlanRows] = useState<TreatmentPlan[]>([]);
  const { data: allServices = [] } = useServices();
  const services = allServices.filter((s) => s.active);
  const plans = planRows.map((plan) => ({ ...plan, items: db.joinOne(plan.items ?? [], 'service', allServices, 'service_id') }));
  const [loading, setLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [templates, setTemplates] = useState<TreatmentPlanTemplate[]>([]);
  const [planForm, setPlanForm] = useState({ title: '', target_end_date: '', notes: '', template_id: '' });
  const [showItemForm, setShowItemForm] = useState<string | null>(null);
  const emptyItem = { service_id: '', tooth_number: null as number | null, description: '', estimated_cost: null as number | null, due_date: '', notes: '' };
  const [itemForm, setItemForm] = useState(emptyItem);

  const load = useCallback(() => {
    const rows = db.orderBy(db.list('treatment_plans', (p) => p.patient_id === patientId), 'created_at', { ascending: false });
    setPlanRows(db.withMany(rows, 'items', 'treatment_plan_items', 'plan_id'));
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    load();
    setTemplates(db.list('treatment_plan_templates', (t) => t.active));
  }, [load]);

  function createPlan() {
    if (!planForm.title) { showToast('عنوان طرح الزامی است', 'error'); return; }
    const values = { title: planForm.title, target_end_date: planForm.target_end_date || null, notes: planForm.notes || null };
    const template = templates.find((t) => t.id === planForm.template_id);
    if (template) {
      createPlanFromTemplate(patientId, template, values);
    } else {
      db.insert('treatment_plans', { ...values, patient_id: patientId, total_estimated_cost: 0, status: 'active' });
    }
    showToast('طرح درمان ایجاد شد');
    setPlanForm({ title: '', target_end_date: '', notes: '', template_id: '' });
    setShowPlanForm(false);
    load();
  }

  function addItem(planId: string) {
    const svc = services.find((s) => s.id === itemForm.service_id);
    const cost = itemForm.estimated_cost ?? svc?.default_price ?? 0;
    db.insert('treatment_plan_items', {
      plan_id: planId,
      patient_id: patientId,
      service_id: itemForm.service_id || null,
      tooth_number: itemForm.tooth_number,
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
    setItemForm(emptyItem);
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

  if (loading) return <Skeleton className="h-32" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-surface-700">طرح‌های درمان</h2>
        <button onClick={() => setShowPlanForm(!showPlanForm)} className="btn-primary text-xs px-3 py-1.5">
          <Plus size={14} />
          طرح جدید
        </button>
      </div>

      {showPlanForm && (
        <div className="card p-4 space-y-3 animate-fade-in">
          {templates.length > 0 && (
            <div>
              <label className="label-field">شروع از الگو</label>
              <select
                className="input-field"
                value={planForm.template_id}
                onChange={(e) => {
                  const template = templates.find((t) => t.id === e.target.value);
                  setPlanForm({ ...planForm, template_id: e.target.value, title: template ? template.name : planForm.title });
                }}
              >
                <option value="">بدون الگو (طرح خالی)</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} - {formatCurrency(t.items.reduce((sum, i) => sum + i.price, 0))}
                  </option>
                ))}
              </select>
            </div>
          )}
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
            <textarea className="input-field min-h-[60px] resize-none" value={planForm.notes} onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })} placeholder="توضیحات اضافی..." />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={createPlan} className="btn-primary">ذخیره طرح درمان</button>
            <button onClick={() => setShowPlanForm(false)} className="btn-secondary">انصراف</button>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="هنوز طرح درمانی ثبت نشده"
            action={<button onClick={() => setShowPlanForm(true)} className="text-sm text-primary-600 hover:underline">+ ایجاد طرح درمان</button>}
          />
        </div>
      ) : (
        plans.map((plan) => {
          const items = plan.items ?? [];
          const completed = items.filter((i) => i.status === 'completed').length;
          const done = items.filter((i) => i.status === 'completed').reduce((sum, i) => sum + (i.actual_cost ?? i.estimated_cost), 0);
          return (
            <div key={plan.id} className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-surface-800">{plan.title}</h3>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {formatDate(plan.start_date || plan.created_at)}
                    {plan.target_end_date && <> · هدف: {formatDate(plan.target_end_date)}</>}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <StatusBadge status={statusStyle(treatmentPlanStatus, plan.status, 'cancelled')} />
                  <button onClick={() => deletePlan(plan.id)} title="حذف طرح" className="p-1.5 rounded-lg text-surface-400 hover:bg-error-50 hover:text-error-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {items.length > 0 && (
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <ProgressBar value={percent(completed, items.length)} />
                  </div>
                  <span className="text-xs text-surface-500">{formatNumber(completed)}/{formatNumber(items.length)}</span>
                </div>
              )}

              <div className="space-y-1.5 mb-3">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${item.status === 'completed' ? 'bg-accent-400' : item.status === 'in_progress' ? 'bg-secondary-400' : 'bg-surface-300'}`} />
                    <span className="text-surface-700 flex-1 min-w-32">
                      {item.service?.name || item.description || 'آیتم'}
                      {item.tooth_number && ` (دندان ${formatNumber(item.tooth_number)})`}
                      {item.due_date && <span className="text-surface-400"> · موعد {formatDate(item.due_date)}</span>}
                    </span>
                    <span className="text-surface-500">{formatCurrency(item.estimated_cost)}</span>
                    {item.status === 'planned' && (
                      <button onClick={() => updateItemStatus(item.id, 'in_progress')} className="btn-chip px-2 py-0.5 bg-secondary-50 text-secondary-700 border-secondary-200 hover:bg-secondary-100">شروع</button>
                    )}
                    {item.status === 'in_progress' && (
                      <button onClick={() => updateItemStatus(item.id, 'completed')} className="btn-chip px-2 py-0.5 bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100">تکمیل</button>
                    )}
                    <StatusBadge status={statusStyle(planItemStatus, item.status, 'planned')} className="px-1.5 py-0.5 rounded-sm" />
                    <button onClick={() => deleteItem(item.id)} title="حذف" className="p-1 rounded-lg text-surface-300 hover:bg-error-50 hover:text-error-500">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {showItemForm === plan.id ? (
                <div className="p-4 bg-surface-50 rounded-xl space-y-3 mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label-field">خدمت</label>
                      <select className="input-field" value={itemForm.service_id} onChange={(e) => {
                        const svc = services.find((s) => s.id === e.target.value);
                        setItemForm({ ...itemForm, service_id: e.target.value, estimated_cost: svc ? svc.default_price : itemForm.estimated_cost, description: svc?.name || itemForm.description });
                      }}>
                        <option value="">-- انتخاب خدمت --</option>
                        {services.map((s) => <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.default_price)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label-field">شماره دندان</label>
                      <NumberInput value={itemForm.tooth_number} onChange={(tooth_number) => setItemForm({ ...itemForm, tooth_number })} />
                    </div>
                    <div>
                      <label className="label-field">هزینه (تومان)</label>
                      <NumberInput value={itemForm.estimated_cost} onChange={(estimated_cost) => setItemForm({ ...itemForm, estimated_cost })} />
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
                    <button onClick={() => addItem(plan.id)} className="btn-primary">افزودن خدمت</button>
                    <button onClick={() => setShowItemForm(null)} className="btn-secondary">انصراف</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowItemForm(plan.id)} className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mb-3">
                  <Plus size={12} />
                  افزودن خدمت
                </button>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-surface-100 text-sm">
                <div>
                  <span className="text-surface-500 text-xs">انجام‌شده: </span>
                  <span className="font-semibold text-accent-600">{formatCurrency(done)}</span>
                </div>
                <div>
                  <span className="text-surface-500 text-xs">باقی‌مانده: </span>
                  <span className="font-semibold text-warning-600">{formatCurrency(Math.max(plan.total_estimated_cost - done, 0))}</span>
                </div>
                <div>
                  <span className="text-surface-500 text-xs">جمع کل: </span>
                  <span className="font-bold text-surface-800">{formatCurrency(plan.total_estimated_cost)}</span>
                </div>
              </div>
              {plan.notes && <p className="text-xs text-surface-400 mt-2">{plan.notes}</p>}
            </div>
          );
        })
      )}
    </div>
  );
}
