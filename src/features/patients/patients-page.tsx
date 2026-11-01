import { useState } from 'react';
import { AlertTriangle, Plus, Search, Users, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { usePatients } from '@/data/patients';
import { useCan } from '@/data/session';
import { errorMessage } from '@/lib/api/errors';
import { formatDate } from '@/lib/date';
import { formatCurrency, formatNumber, fullName } from '@/lib/format';
import { patientBalances } from '@/lib/patient-balance';
import { CAN } from '@/lib/permissions';
import type { PageKey, Patient } from '@/lib/types';
import { PatientDetail, type PatientTab } from './patient-detail';
import { PatientForm } from './patient-form';

interface PatientsProps {
  /** A patient to open on arrival, set when another page links to a patient. */
  selectedPatientId: string | null;
  onNavigate: (page: PageKey) => void;
}

type BalanceFilter = 'all' | 'debt' | 'credit';

const balanceFilters: { value: BalanceFilter; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'debt', label: 'بدهکار' },
  { value: 'credit', label: 'بستانکار' },
];

export function Patients({ selectedPatientId, onNavigate }: PatientsProps) {
  const { data: patients = [], isPending: loading, error, refetch } = usePatients();
  const canCreate = useCan(CAN.createClient);
  const canUpdate = useCan(CAN.updateClient);
  /** What each patient owes, from the invoices in the browser store (a cheap read, done every render). */
  const balances = patientBalances();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<BalanceFilter>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [detailId, setDetailId] = useState<string | null>(selectedPatientId);
  const [activeTab, setActiveTab] = useState<PatientTab>('info');

  const detailPatient = detailId ? patients.find((p) => p.id === detailId) : null;

  const balanceOf = (p: Patient) => balances.get(p.id) ?? 0;
  const filtered = patients.filter((p) => {
    if (filter === 'debt' && balanceOf(p) <= 0) return false;
    if (filter === 'credit' && balanceOf(p) >= 0) return false;
    const q = search.trim();
    if (!q) return true;
    return (
      p.first_name.includes(q) ||
      p.last_name.includes(q) ||
      fullName(p).includes(q) ||
      p.phone.includes(q) ||
      (p.national_id && p.national_id.includes(q))
    );
  });

  function openNewForm() {
    setEditingPatient(null);
    setShowForm(true);
  }

  const form = showForm && (
    <PatientForm
      patient={editingPatient}
      onClose={() => setShowForm(false)}
      onSaved={() => setShowForm(false)}
    />
  );

  if (detailPatient) {
    return (
      <>
        <PatientDetail
          patient={detailPatient}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onBack={() => { setDetailId(null); setActiveTab('info'); }}
          onEdit={canUpdate ? () => { setEditingPatient(detailPatient); setShowForm(true); } : undefined}
          onNavigate={onNavigate}
        />
        {form}
      </>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="بیماران" subtitle={<>{formatNumber(patients.length)} بیمار ثبت‌شده</>}>
        {canCreate && (
          <button onClick={openNewForm} className="btn-primary">
            <Plus size={16} />
            بیمار جدید
          </button>
        )}
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام، تلفن یا کد ملی..."
            className="input-field pr-9 pl-9 py-2.5"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-surface-400 hover:bg-surface-100">
              <X size={16} />
            </button>
          )}
        </div>
        <ChoiceChips options={balanceFilters} value={filter} onChange={setFilter} className="flex gap-2" chipClassName="px-3 py-2 text-sm" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <SkeletonList count={6} className="h-32" />
        </div>
      ) : error ? (
        <EmptyState
          icon={Users}
          title="بیماران بارگذاری نشدند"
          description={errorMessage(error)}
          action={<button onClick={() => refetch()} className="btn-secondary">تلاش دوباره</button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="بیماری یافت نشد"
          description={search || filter !== 'all' ? 'عبارت جستجو یا فیلتر را تغییر دهید' : 'اولین بیمار خود را ثبت کنید'}
          action={
            canCreate && (
              <button onClick={openNewForm} className="btn-primary">
                <Plus size={16} />
                بیمار جدید
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((patient) => {
            const balance = balanceOf(patient);
            return (
              <div key={patient.id} className="card card-hover p-4 cursor-pointer" onClick={() => setDetailId(patient.id)}>
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 rounded-full text-base shrink-0">{patient.first_name.charAt(0)}</Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-surface-800 truncate">{fullName(patient)}</h3>
                      <span className="text-xs text-surface-400 shrink-0">{patient.gender === 'female' ? 'زن' : 'مرد'}</span>
                    </div>
                    <p className="text-xs text-surface-500 mt-0.5">{patient.phone}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                      <span className="text-xs text-surface-500">{formatNumber(patient.appointment_count)} نوبت</span>
                      {patient.insurance_company && <span className="text-xs bg-secondary-50 text-secondary-600 px-1.5 py-0.5 rounded-sm">{patient.insurance_company}</span>}
                      {patient.allergies && (
                        <span className="inline-flex items-center gap-1 text-xs bg-error-50 text-error-500 px-1.5 py-0.5 rounded-sm">
                          <AlertTriangle size={11} />
                          آلرژی
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {balance !== 0 && (
                  <div className="mt-3 pt-3 border-t border-surface-100 flex items-center justify-between">
                    <span className="text-xs text-surface-500">{balance > 0 ? 'بدهی' : 'اعتبار'}</span>
                    <span className={`text-xs font-semibold ${balance > 0 ? 'text-error-500' : 'text-accent-600'}`}>{formatCurrency(Math.abs(balance))}</span>
                  </div>
                )}
                {patient.last_visit && (
                  <div className="mt-2 flex items-center justify-between text-xs text-surface-400">
                    <span>آخرین مراجعه</span>
                    <span>{formatDate(patient.last_visit)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {form}
    </div>
  );
}
