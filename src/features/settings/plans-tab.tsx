import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { statusStyle, treatmentPlanStatus } from '@/constants/status';
import { formatDate } from '@/lib/date';
import { formatCurrency, formatNumber, fullName, percent } from '@/lib/format';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { Service, TreatmentPlan, TreatmentPlanTemplate } from '@/lib/types';
import { TemplateForm } from './template-form';

/**
 * The treatment-plan templates the clinic offers, and every patient's plans (read-only:
 * plans are edited from the patient record).
 */
export function PlansTab() {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [templates, setTemplates] = useState<TreatmentPlanTemplate[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  /** The template being edited, `null` while adding one, `undefined` when the dialog is closed. */
  const [editing, setEditing] = useState<TreatmentPlanTemplate | null | undefined>(undefined);

  const loadTemplates = useCallback(() => {
    setTemplates(db.orderBy(db.list('treatment_plan_templates'), 'created_at'));
  }, []);

  function deleteTemplate(id: string) {
    db.remove('treatment_plan_templates', id);
    showToast('الگو حذف شد');
    loadTemplates();
  }

  useEffect(() => {
    loadTemplates();
    setServices(db.list('services', (svc) => svc.active));
    const rows = db.orderBy(db.list('treatment_plans'), 'created_at', { ascending: false });
    setPlans(db.withMany(db.withOne(rows, 'patient', 'patients', 'patient_id'), 'items', 'treatment_plan_items', 'plan_id'));
  }, [loadTemplates]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-surface-700">الگوهای طرح درمان ({formatNumber(templates.length)})</h2>
        <button onClick={() => setEditing(null)} className="btn-primary">
          <Plus size={16} />
          الگوی جدید
        </button>
      </div>

      {templates.length === 0 && <div className="card p-6 text-center text-sm text-surface-400">هنوز الگویی تعریف نشده است</div>}
      {templates.map((template) => (
        <div key={template.id} className="card p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-surface-800">{template.name}</h3>
              {template.description && <p className="text-xs text-surface-500 mt-0.5">{template.description}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${template.active ? 'bg-accent-100 text-accent-700' : 'bg-surface-100 text-surface-500'}`}>
                {template.active ? 'فعال' : 'غیرفعال'}
              </span>
              <button onClick={() => setEditing(template)} className="text-xs text-primary-600 hover:underline">ویرایش</button>
              <button onClick={() => deleteTemplate(template.id)} className="text-xs text-error-500 hover:underline">حذف</button>
            </div>
          </div>
          <div className="space-y-1.5 border-t border-surface-100 pt-3">
            {template.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-surface-600">• {item.description}</span>
                <span className="font-medium text-surface-700">{formatCurrency(item.price)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1.5 border-t border-surface-100">
              <span className="text-xs font-semibold text-surface-700">جمع کل</span>
              <span className="text-sm font-bold text-primary-700">{formatCurrency(template.items.reduce((sum, i) => sum + i.price, 0))}</span>
            </div>
          </div>
        </div>
      ))}

      {editing !== undefined && (
        <TemplateForm template={editing} services={services} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); loadTemplates(); }} />
      )}


      <h2 className="text-sm font-semibold text-surface-700 pt-4">طرح‌های درمان بیماران ({formatNumber(plans.length)})</h2>
      {plans.length === 0 ? (
        <div className="card p-8 text-center">
          <ClipboardList size={32} className="text-surface-300 mx-auto mb-3" />
          <p className="text-sm text-surface-400">هنوز هیچ طرح درمانی ایجاد نشده است</p>
          <p className="text-xs text-surface-400 mt-1">طرح‌های درمان از پرونده بیمار ایجاد می‌شوند</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const total = plan.items?.length || 0;
            const completed = plan.items?.filter((i) => i.status === 'completed').length || 0;
            const progress = percent(completed, total);
            return (
              <div key={plan.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-surface-800">{plan.title}</h3>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {fullName(plan.patient)} · {formatDate(plan.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={statusStyle(treatmentPlanStatus, plan.status, 'cancelled')} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar value={progress} />
                  </div>
                  <span className="text-xs text-surface-500">{formatNumber(completed)}/{formatNumber(total)}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100">
                  <span className="text-xs text-surface-500">جمع کل: <span className="text-sm font-bold text-primary-700">{formatCurrency(plan.total_estimated_cost)}</span></span>
                  {plan.target_end_date && <span className="text-xs text-surface-400">موعد: {formatDate(plan.target_end_date)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
