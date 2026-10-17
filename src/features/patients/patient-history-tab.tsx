import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { appointmentStatus, invoiceStatus, statusStyle } from '@/constants/status';
import { formatDateNumeric } from '@/lib/date';
import { formatCurrency, formatTime } from '@/lib/format';
import { usePatientAppointments } from '@/data/appointments';
import * as db from '@/lib/store';
import type { Invoice } from '@/lib/types';
import { PatientLabOrders } from './patient-lab-orders';
import { TreatmentHistory } from './treatment-history';

/** Everything that has happened for a patient: treatments, appointments, invoices and lab orders. */
export function PatientHistoryTab({ patientId }: { patientId: string }) {
  const { data: appointments = [] } = usePatientAppointments(patientId);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const invs = db.orderBy(db.list('invoices', (i) => i.patient_id === patientId), 'created_at', { ascending: false });
    setInvoices(db.withMany(invs, 'items', 'invoice_items', 'invoice_id'));
  }, [patientId]);

  return (
    <div className="space-y-4">
      <TreatmentHistory patientId={patientId} />

      <div className="card p-5">
        <SectionHeader title="سابقه نوبت‌ها" className="mb-3" />
        {appointments.length === 0 ? (
          <p className="text-xs text-surface-400">نوبتی یافت نشد</p>
        ) : (
          <div className="space-y-1">
            {appointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 text-sm p-2 rounded-xl hover:bg-surface-50">
                <span className="text-surface-400 text-xs w-20 shrink-0">{formatDateNumeric(apt.appointment_date)}</span>
                <span className="text-surface-700 flex-1 min-w-0 truncate">{apt.service?.name || 'نوبت عمومی'}</span>
                <span className="text-surface-400 text-xs hidden sm:inline">{formatTime(apt.start_time)}</span>
                <StatusBadge status={statusStyle(appointmentStatus, apt.status, 'pending')} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <SectionHeader title="سابقه مالی" className="mb-3" />
        {invoices.length === 0 ? (
          <p className="text-xs text-surface-400">فاکتوری یافت نشد</p>
        ) : (
          <div className="space-y-1">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-50 text-sm">
                <span className="text-surface-400 text-xs w-20 shrink-0">{formatDateNumeric(inv.created_at)}</span>
                <span className="text-surface-700 flex-1 min-w-0 truncate text-xs">
                  {inv.items?.map((i) => i.description).join('، ') || inv.invoice_number || 'صورتحساب'}
                </span>
                <span className="font-semibold text-surface-800 text-xs sm:text-sm">{formatCurrency(inv.total)}</span>
                <StatusBadge status={statusStyle(invoiceStatus, inv.status, 'unpaid')} />
              </div>
            ))}
          </div>
        )}
      </div>

      <PatientLabOrders patientId={patientId} />
    </div>
  );
}
