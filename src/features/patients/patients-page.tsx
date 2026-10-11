import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Plus, Search, Users, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { formatDate, todayISO } from '@/lib/date';
import { formatCurrency, formatNumber, fullName } from '@/lib/format';
import * as db from '@/lib/store';
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

/** Per patient: how many appointments they have and the date of their last completed visit. */
function loadVisits(): Map<string, { count: number; lastVisit: string | null }> {
  const today = todayISO();
  const visits = new Map<string, { count: number; lastVisit: string | null }>();
  for (const apt of db.list('appointments')) {
    const entry = visits.get(apt.patient_id) ?? { count: 0, lastVisit: null };
    entry.count += 1;
    if (apt.status === 'completed' && apt.appointment_date <= today && (!entry.lastVisit || apt.appointment_date > entry.lastVisit)) {
      entry.lastVisit = apt.appointment_date;
    }
    visits.set(apt.patient_id, entry);
  }
  return visits;
}

export function Patients({ selectedPatientId, onNavigate }: PatientsProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState(() => new Map<string, { count: number; lastVisit: string | null }>());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<BalanceFilter>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [detailId, setDetailId] = useState<string | null>(selectedPatientId);
  const [activeTab, setActiveTab] = useState<PatientTab>('info');

  const loadPatients = useCallback(() => {
    setLoading(true);
    setPatients(db.orderBy(db.list('patients'), 'created_at', { ascending: false }));
    setVisits(loadVisits());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const detailPatient = detailId ? patients.find((p) => p.id === detailId) : null;

  const filtered = patients.filter((p) => {
    if (filter === 'debt' && p.balance <= 0) return false;
    if (filter === 'credit' && p.balance >= 0) return false;
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
      onSaved={() => { loadPatients(); setShowForm(false); }}
    />
  );

  if (detailPatient) {
    return (
      <>
        <PatientDetail
          patient={detailPatient}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onBack={() => { setDetailId(null); setActiveTab('info'); loadPatients(); }}
          onEdit={() => { setEditingPatient(detailPatient); setShowForm(true); }}
          onNavigate={onNavigate}
        />
        {form}
      </>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="بیماران" subtitle={<>{formatNumber(patients.length)} بیمار ثبت‌شده</>}>
        <button onClick={openNewForm} className="btn-primary">
          <Plus size={16} />
          بیمار جدید
        </button>
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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="بیماری یافت نشد"
          description={search || filter !== 'all' ? 'عبارت جستجو یا فیلتر را تغییر دهید' : 'اولین بیمار خود را ثبت کنید'}
          action={
            <button onClick={openNewForm} className="btn-primary">
              <Plus size={16} />
              بیمار جدید
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((patient) => {
            const visit = visits.get(patient.id);
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
                      <span className="text-xs text-surface-500">{formatNumber(visit?.count ?? 0)} نوبت</span>
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
                {patient.balance !== 0 && (
                  <div className="mt-3 pt-3 border-t border-surface-100 flex items-center justify-between">
                    <span className="text-xs text-surface-500">{patient.balance > 0 ? 'بدهی' : 'اعتبار'}</span>
                    <span className={`text-xs font-semibold ${patient.balance > 0 ? 'text-error-500' : 'text-accent-600'}`}>{formatCurrency(Math.abs(patient.balance))}</span>
                  </div>
                )}
                {visit?.lastVisit && (
                  <div className="mt-2 flex items-center justify-between text-xs text-surface-400">
                    <span>آخرین مراجعه</span>
                    <span>{formatDate(visit.lastVisit)}</span>
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
