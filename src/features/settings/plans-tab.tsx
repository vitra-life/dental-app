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
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">{formatNumber(plans.length)} طرح درمان</p>
      </div>
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
              <div key={plan.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-surface-800 text-sm">{plan.title}</p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {fullName(plan.patient)} • {formatDate(plan.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={statusStyle(treatmentPlanStatus, plan.status, 'cancelled')} />
                </div>
                <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
                  <span>{formatNumber(completed)} از {formatNumber(total)} آیتم تکمیل شده</span>
                  <span className="font-medium text-primary-600">{formatNumber(progress)}%</span>
                </div>
                <ProgressBar value={progress} />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-surface-400">هزینه تخمینی: {formatCurrency(plan.total_estimated_cost)}</span>
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
