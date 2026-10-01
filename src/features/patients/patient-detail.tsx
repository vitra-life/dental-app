import { AlertCircle, Calendar, ClipboardList, Edit3, FileText, FlaskConical, Image, Phone, Smile } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import { getAge } from '@/lib/date';
import { formatCurrency, formatNumber, fullName, getInitials } from '@/lib/format';
import type { Patient } from '@/lib/types';
import { DentalChart } from './dental-chart';
import { PatientInfoTab } from './patient-info-tab';
import { PatientLabOrders } from './patient-lab-orders';
import { RvgManager } from './rvg-manager';
import { TreatmentHistory } from './treatment-history';
import { TreatmentPlanTab } from './treatment-plan-tab';

export type PatientTab = 'info' | 'dental' | 'rvg' | 'lab' | 'history' | 'plan';

const tabs: TabItem<PatientTab>[] = [
  { key: 'info', label: 'اطلاعات کلی', icon: <FileText size={16} /> },
  { key: 'dental', label: 'نمودار دندان', icon: <Smile size={16} /> },
  { key: 'rvg', label: 'تصاویر RVG', icon: <Image size={16} /> },
  { key: 'lab', label: 'سفارشات لابراتوار', icon: <FlaskConical size={16} /> },
  { key: 'history', label: 'سابقه درمان', icon: <Calendar size={16} /> },
  { key: 'plan', label: 'طرح درمان', icon: <ClipboardList size={16} /> },
];

interface PatientDetailProps {
  patient: Patient;
  activeTab: PatientTab;
  onTabChange: (tab: PatientTab) => void;
  onClose: () => void;
  onEdit: () => void;
}

/** The patient record dialog: a summary header and one tab per part of the record. */
export function PatientDetail({ patient, activeTab, onTabChange, onClose, onEdit }: PatientDetailProps) {
  return (
    <Modal open onClose={onClose} title={fullName(patient)} size="xl">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-surface-50 rounded-xl">
          <Avatar className="w-16 h-16 rounded-2xl text-xl shrink-0">{getInitials(patient.first_name, patient.last_name)}</Avatar>
          <div className="flex-1">
            <h3 className="font-bold text-surface-800 text-lg">{fullName(patient)}</h3>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-surface-500">
              <span className="flex items-center gap-1"><Phone size={12} /> {patient.phone}</span>
              {patient.birth_date && <span>{formatNumber(getAge(patient.birth_date))} ساله</span>}
              {patient.insurance_company && <span className="badge bg-secondary-50 text-secondary-600">{patient.insurance_company}</span>}
              {patient.balance > 0 && <span className="badge bg-error-50 text-error-600">بدهی: {formatCurrency(patient.balance)}</span>}
            </div>
          </div>
          <button onClick={onEdit} className="btn-secondary">
            <Edit3 size={16} />
            ویرایش
          </button>
        </div>

        {patient.allergies && (
          <div className="flex items-center gap-2 px-4 py-3 bg-warning-50 border border-warning-200 rounded-xl">
            <AlertCircle size={18} className="text-warning-500" />
            <span className="text-sm font-medium text-warning-700">آلرژی: {patient.allergies}</span>
          </div>
        )}

        <Tabs tabs={tabs} active={activeTab} onChange={onTabChange} />

        {activeTab === 'info' && <PatientInfoTab patient={patient} />}
        {activeTab === 'dental' && <DentalChart patientId={patient.id} />}
        {activeTab === 'rvg' && <RvgManager patientId={patient.id} />}
        {activeTab === 'lab' && <PatientLabOrders patientId={patient.id} />}
        {activeTab === 'history' && <TreatmentHistory patientId={patient.id} />}
        {activeTab === 'plan' && <TreatmentPlanTab patientId={patient.id} />}
      </div>
    </Modal>
  );
}
