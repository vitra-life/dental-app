import { useState, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { statusStyle, treatmentPlanStatus } from '@/constants/status';
import { formatDate } from '@/lib/date';
import { formatCurrency, formatNumber, fullName, percent } from '@/lib/format';
import * as db from '@/lib/store';
import type { TreatmentPlan } from '@/lib/types';

/** Every patient's treatment plans, read-only. Plans are edited from the patient record. */
export function PlansTab() {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);

  useEffect(() => {
    const rows = db.orderBy(db.list('treatment_plans'), 'created_at', { ascending: false });
    setPlans(db.withMany(db.withOne(rows, 'patient', 'patients', 'patient_id'), 'items', 'treatment_plan_items', 'plan_id'));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-surface-700">طرح‌های درمان بیماران ({formatNumber(plans.length)})</h2>
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
