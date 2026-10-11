import { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import { getAge } from '@/lib/date';
import { formatCurrency, formatNumber, fullName } from '@/lib/format';
import * as db from '@/lib/store';
import type { PageKey, Patient } from '@/lib/types';
import { DentalChart } from './dental-chart';
import { PatientHistoryTab } from './patient-history-tab';
import { PatientInfoTab } from './patient-info-tab';
import { RvgManager } from './rvg-manager';
import { TreatmentPlanTab } from './treatment-plan-tab';

export type PatientTab = 'info' | 'plan' | 'dental' | 'rvg' | 'history';

interface PatientDetailProps {
  patient: Patient;
  activeTab: PatientTab;
  onTabChange: (tab: PatientTab) => void;
  /** Returns to the patient list. */
  onBack: () => void;
  onEdit: () => void;
  onNavigate: (page: PageKey) => void;
}

/** The patient record page: a breadcrumb, a summary card and one tab per part of the record. */
export function PatientDetail({ patient, activeTab, onTabChange, onBack, onEdit, onNavigate }: PatientDetailProps) {
  // Counted once per visit to the record; the plan tab reloads its own list.
  const [planCount] = useState(() => db.list('treatment_plans', (p) => p.patient_id === patient.id).length);

  const tabs: TabItem<PatientTab>[] = [
    { key: 'info', label: 'اطلاعات' },
    { key: 'plan', label: `طرح درمان (${formatNumber(planCount)})` },
    { key: 'dental', label: 'نمودار دندان' },
    { key: 'rvg', label: 'تصاویر RVG' },
    { key: 'history', label: 'سابقه' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={onBack} title="بازگشت" className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors">
          <ChevronRight size={20} />
        </button>
        <button onClick={onBack} className="text-sm text-surface-500 hover:text-surface-700">بیماران</button>
        <ChevronLeft size={16} className="text-surface-300" />
        <span className="text-sm font-medium text-surface-700">{fullName(patient)}</span>
      </div>

      <div className="card p-5">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14 rounded-2xl text-xl shrink-0">{patient.first_name.charAt(0)}</Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-lg font-bold text-surface-800">{fullName(patient)}</h1>
                <p className="text-sm text-surface-500">
                  {patient.gender === 'female' ? 'زن' : 'مرد'}
                  {patient.birth_date && <> · {formatNumber(getAge(patient.birth_date))} ساله</>} · {patient.phone}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => onNavigate('appointments')} className="btn-primary text-xs px-3 py-1.5">رزرو نوبت</button>
                <button onClick={() => onNavigate('billing')} className="btn-secondary text-xs px-3 py-1.5">صدور فاکتور</button>
                <button onClick={onEdit} className="btn-secondary text-xs px-3 py-1.5">
                  <Edit3 size={13} />
                  ویرایش
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {patient.national_id && <span className="text-xs text-surface-500">کد ملی: {patient.national_id}</span>}
              {patient.insurance_company && <span className="text-xs bg-secondary-50 text-secondary-600 px-2 py-0.5 rounded-lg">{patient.insurance_company}</span>}
              {patient.balance > 0 && <span className="text-xs bg-error-50 text-error-500 px-2 py-0.5 rounded-lg">بدهی: {formatCurrency(patient.balance)}</span>}
              {patient.balance < 0 && <span className="text-xs bg-accent-50 text-accent-600 px-2 py-0.5 rounded-lg">اعتبار: {formatCurrency(-patient.balance)}</span>}
            </div>
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={onTabChange} />

      {activeTab === 'info' && <PatientInfoTab patient={patient} />}
      {activeTab === 'plan' && <TreatmentPlanTab patientId={patient.id} />}
      {activeTab === 'dental' && <DentalChart patientId={patient.id} />}
      {activeTab === 'rvg' && <RvgManager patientId={patient.id} />}
      {activeTab === 'history' && <PatientHistoryTab patientId={patient.id} />}
    </div>
  );
}
