import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Plus, Search, Users, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { formatDate, getAge } from '@/lib/date';
import { formatNumber, fullName, getInitials } from '@/lib/format';
import * as db from '@/lib/store';
import type { Patient } from '@/lib/types';
import { PatientDetail, type PatientTab } from './patient-detail';
import { PatientForm } from './patient-form';

interface PatientsProps {
  /** A patient to open on arrival, set when another page links to a patient. */
  selectedPatientId: string | null;
}

export function Patients({ selectedPatientId }: PatientsProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<PatientTab>('info');

  const loadPatients = useCallback(() => {
    setLoading(true);
    setPatients(db.orderBy(db.list('patients'), 'created_at', { ascending: false }));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      const found = db.get('patients', selectedPatientId);
      if (found) setDetailPatient(found);
    }
  }, [selectedPatientId]);

  const filtered = patients.filter((p) => {
    const q = search.trim();
    if (!q) return true;
    return (
      p.first_name.includes(q) ||
      p.last_name.includes(q) ||
      p.phone.includes(q) ||
      (p.national_id && p.national_id.includes(q))
    );
  });

  function openNewForm() {
    setEditingPatient(null);
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت بیماران" subtitle={<>{formatNumber(patients.length)} بیمار ثبت شده</>}>
        <button onClick={openNewForm} className="btn-primary">
          <Plus size={18} />
          بیمار جدید
        </button>
      </PageHeader>

      <div className="flex items-center gap-2 bg-white rounded-xl border border-surface-200 px-4 py-2.5 shadow-card">
        <Search size={18} className="text-surface-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو با نام، تلفن یا کد ملی..."
          className="bg-transparent text-sm outline-hidden flex-1 text-surface-700 placeholder:text-surface-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="p-1 rounded-lg hover:bg-surface-100">
            <X size={16} className="text-surface-400" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonList count={6} className="h-40" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="هیچ بیماری یافت نشد"
          description={search ? 'عبارت جستجو را تغییر دهید' : 'اولین بیمار خود را ثبت کنید'}
          action={
            <button onClick={openNewForm} className="btn-primary">
              <Plus size={18} />
              بیمار جدید
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((patient, i) => (
            <div
              key={patient.id}
              className="card card-hover p-5 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => setDetailPatient(patient)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12 rounded-xl text-base shrink-0">{getInitials(patient.first_name, patient.last_name)}</Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-surface-800 text-sm truncate">{fullName(patient)}</h3>
                  <p className="text-xs text-surface-400 mt-0.5">{patient.phone}</p>
                  {patient.birth_date && (
                    <p className="text-xs text-surface-400 mt-0.5">{formatNumber(getAge(patient.birth_date))} ساله</p>
                  )}
                </div>
                {patient.balance > 0 && (
                  <span className="badge bg-error-50 text-error-600">بدهکار</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface-100">
                {patient.allergies && (
                  <span className="badge bg-warning-50 text-warning-600">
                    <AlertCircle size={12} />
                    آلرژی
                  </span>
                )}
                {patient.insurance_company && (
                  <span className="badge bg-secondary-50 text-secondary-600">
                    بیمه
                  </span>
                )}
                <span className="text-xs text-surface-400 mr-auto">
                  {formatDate(patient.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PatientForm
          patient={editingPatient}
          onClose={() => setShowForm(false)}
          onSaved={() => { loadPatients(); setShowForm(false); }}
        />
      )}

      {detailPatient && (
        <PatientDetail
          patient={detailPatient}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setDetailPatient(null)}
          onEdit={() => { setEditingPatient(detailPatient); setDetailPatient(null); setShowForm(true); }}
        />
      )}
    </div>
  );
}
