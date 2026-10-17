import { AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/date';
import type { Patient } from '@/lib/types';

/** Splits a free-text list ("دیابت، فشار خون") into its entries. */
const splitList = (text: string | null) => (text ? text.split(/[،,]/).map((s) => s.trim()).filter(Boolean) : []);

export function PatientInfoTab({ patient }: { patient: Patient }) {
  const rows = [
    { label: 'تاریخ تولد', value: patient.birth_date ? formatDate(patient.birth_date) : null },
    { label: 'کد ملی', value: patient.national_id },
    { label: 'تلفن', value: patient.phone },
    { label: 'ایمیل', value: patient.email },
    { label: 'آدرس', value: patient.address },
    { label: 'گروه خونی', value: patient.blood_type },
    { label: 'بیمه', value: patient.insurance_company },
    { label: 'شماره بیمه', value: patient.insurance_number },
    { label: 'تاریخ ثبت', value: formatDate(patient.created_at) },
  ];
  const allergies = splitList(patient.allergies);
  const history = splitList(patient.medical_history);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-surface-700 mb-3">اطلاعات پایه</h2>
        <dl className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.label} className="flex gap-3 text-sm">
              <dt className="text-surface-400 w-28 shrink-0">{row.label}</dt>
              <dd className="text-surface-700 font-medium min-w-0 break-words">{row.value || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="space-y-4">
        {allergies.length > 0 && (
          <div className="bg-error-50 border border-error-100 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-error-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle size={15} />
              آلرژی‌ها
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((a) => <span key={a} className="text-xs bg-error-100 text-error-700 px-2 py-1 rounded-lg">{a}</span>)}
            </div>
          </div>
        )}
        {history.length > 0 && (
          <div className="bg-warning-50 border border-warning-100 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-warning-700 mb-2">سابقه بیماری</h2>
            <div className="flex flex-wrap gap-1.5">
              {history.map((m) => <span key={m} className="text-xs bg-warning-100 text-warning-700 px-2 py-1 rounded-lg">{m}</span>)}
            </div>
          </div>
        )}
        {(patient.emergency_contact || patient.emergency_phone) && (
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-surface-700 mb-2">تماس اضطراری</h2>
            {patient.emergency_contact && <p className="text-sm text-surface-700">{patient.emergency_contact}</p>}
            {patient.emergency_phone && <p className="text-sm text-surface-500">{patient.emergency_phone}</p>}
          </div>
        )}
        {patient.notes && (
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-surface-700 mb-2">یادداشت</h2>
            <p className="text-sm text-surface-600 leading-6">{patient.notes}</p>
          </div>
        )}
        {allergies.length === 0 && history.length === 0 && !patient.emergency_contact && !patient.emergency_phone && !patient.notes && (
          <div className="card p-4 text-sm text-surface-400">سابقه پزشکی یا یادداشتی ثبت نشده است</div>
        )}
      </div>
    </div>
  );
}
