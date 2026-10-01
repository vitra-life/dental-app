import { useState, useEffect, useCallback } from 'react';
import { FlaskConical } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { labOrderStatus, statusStyle } from '@/constants/status';
import { formatCurrency } from '@/lib/format';
import * as db from '@/lib/store';
import type { LabOrder } from '@/lib/types';

export function PatientLabOrders({ patientId }: { patientId: string }) {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const rows = db.orderBy(db.list('lab_orders', (o) => o.patient_id === patientId), 'created_at', { ascending: false });
    setOrders(db.withOne(rows, 'lab', 'labs', 'lab_id'));
    setLoading(false);
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Skeleton className="h-32" variant="inset" />;
  if (orders.length === 0) return <EmptyState icon={FlaskConical} title="هیچ سفارش لابراتوار" description="سفارشات لابراتوار این بیمار اینجا نمایش داده می‌شود" />;

  return (
    <div className="space-y-3">
      {orders.map((order) => (
          <div key={order.id} className="flex items-center gap-3 p-4 bg-surface-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0">
              <FlaskConical size={18} className="text-secondary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-surface-800 text-sm">{order.service_name}</p>
              <p className="text-xs text-surface-400 mt-0.5">
                {order.lab?.name || 'نامشخص'} • {formatCurrency(order.price)}
              </p>
            </div>
            <StatusBadge status={statusStyle(labOrderStatus, order.status, 'pending')} />
          </div>
      ))}
    </div>
  );
}
