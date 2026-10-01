import { AlertCircle, FileText, Heart, Mail, MapPin, Phone } from 'lucide-react';
import type { Patient } from '@/lib/types';

export function PatientInfoTab({ patient }: { patient: Patient }) {
  const infoItems = [
    { label: 'تلفن', value: patient.phone, icon: Phone },
    { label: 'ایمیل', value: patient.email, icon: Mail },
    { label: 'آدرس', value: patient.address, icon: MapPin },
    { label: 'کد ملی', value: patient.national_id, icon: FileText },
    { label: 'گروه خونی', value: patient.blood_type, icon: Heart },
    { label: 'بیماری‌های زمینه‌ای', value: patient.medical_history, icon: AlertCircle },
    { label: 'شرکت بیمه', value: patient.insurance_company, icon: FileText },
    { label: 'شماره بیمه', value: patient.insurance_number, icon: FileText },
    { label: 'تماس اضطراری', value: patient.emergency_contact, icon: Phone },
    { label: 'تلفن اضطراری', value: patient.emergency_phone, icon: Phone },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {infoItems
        .filter((item) => item.value)
        .map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
                <Icon size={16} className="text-surface-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-surface-400 mb-0.5">{item.label}</p>
                <p className="text-sm font-medium text-surface-700 truncate">{item.value}</p>
              </div>
            </div>
          );
        })}
      {patient.notes && (
        <div className="md:col-span-2 p-3 bg-surface-50 rounded-xl">
          <p className="text-xs text-surface-400 mb-1">یادداشت</p>
          <p className="text-sm text-surface-700">{patient.notes}</p>
        </div>
      )}
    </div>
  );
}
