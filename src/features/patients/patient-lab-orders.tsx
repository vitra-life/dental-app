import { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { labOrderStatus, statusStyle } from '@/constants/status';
import { formatDateNumeric } from '@/lib/date';
import { formatCurrency } from '@/lib/format';
import * as db from '@/lib/store';
import type { LabOrder } from '@/lib/types';

/** The patient's lab orders, newest first. Renders nothing when there are none. */
export function PatientLabOrders({ patientId }: { patientId: string }) {
  const [orders, setOrders] = useState<LabOrder[]>([]);

  useEffect(() => {
    const rows = db.orderBy(db.list('lab_orders', (o) => o.patient_id === patientId), 'created_at', { ascending: false });
    setOrders(db.withOne(rows, 'lab', 'labs', 'lab_id'));
  }, [patientId]);

  if (orders.length === 0) return null;

  return (
    <div className="card p-5">
      <SectionHeader title="سفارشات لابراتوار" className="mb-3" />
      <div className="space-y-1">
        {orders.map((order) => (
          <div key={order.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-50 text-sm">
            <span className="text-surface-400 text-xs w-20 shrink-0">{formatDateNumeric(order.order_date)}</span>
            <span className="text-surface-700 flex-1 min-w-0 truncate">
              {order.service_name}
              {order.tooth_numbers && <span className="text-surface-400"> (دندان {order.tooth_numbers})</span>}
            </span>
            <span className="text-xs text-surface-500 hidden sm:inline">{order.lab?.name || 'نامشخص'}</span>
            <span className="text-xs font-semibold text-surface-700 hidden sm:inline">{formatCurrency(order.price)}</span>
            <StatusBadge status={statusStyle(labOrderStatus, order.status, 'pending')} />
          </div>
        ))}
      </div>
    </div>
  );
}
