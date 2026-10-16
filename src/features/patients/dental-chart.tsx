import { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { toothStatus } from '@/constants/status';
import { formatDate, formatDateNumeric, todayISO } from '@/lib/date';
import { formatNumber } from '@/lib/format';
import { useServices } from '@/data/services';
import * as db from '@/lib/store';
import { showToast } from '@/lib/toast';
import type { DentalRecord } from '@/lib/types';

interface DentalChartProps {
  patientId: string;
}

type ToothStatus = DentalRecord['status'];
const toothStatuses = Object.keys(toothStatus) as ToothStatus[];

// FDI tooth numbers, one array per quadrant, in the order they appear across each jaw.
const upperTeeth = [[18, 17, 16, 15, 14, 13, 12, 11], [21, 22, 23, 24, 25, 26, 27, 28]];
const lowerTeeth = [[48, 47, 46, 45, 44, 43, 42, 41], [31, 32, 33, 34, 35, 36, 37, 38]];

export function DentalChart({ patientId }: DentalChartProps) {
  const [records, setRecords] = useState<DentalRecord[]>([]);
  const { data: allServices = [] } = useServices();
  const services = allServices.filter((s) => s.active);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [form, setForm] = useState<{ status: ToothStatus; treatment_type: string; notes: string }>({ status: 'decayed', treatment_type: '', notes: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setRecords(db.orderBy(db.list('dental_records', (r) => r.patient_id === patientId), 'created_at', { ascending: false }));
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  function getToothStatus(toothNum: number): ToothStatus {
    const record = records.find((r) => r.tooth_number === toothNum);
    return record?.status || 'healthy';
  }

  function saveRecord() {
    if (selectedTooth === null) return;
    const existing = records.find((r) => r.tooth_number === selectedTooth);
    const values = {
      status: form.status,
      treatment_type: form.treatment_type || null,
      notes: form.notes || null,
      treatment_date: todayISO(),
    };
    if (existing) {
      db.update('dental_records', existing.id, values);
      showToast('نمودار دندان بروزرسانی شد');
    } else {
      db.insert('dental_records', { ...values, patient_id: patientId, tooth_number: selectedTooth });
      showToast('درمان دندان ثبت شد');
    }
    setSelectedTooth(null);
    setForm({ status: 'decayed', treatment_type: '', notes: '' });
    load();
  }

  function deleteRecord(toothNum: number) {
    db.removeWhere('dental_records', (r) => r.patient_id === patientId && r.tooth_number === toothNum);
    showToast('رکورد حذف شد');
    load();
  }

  function openTooth(toothNum: number) {
    setSelectedTooth(toothNum);
    const existing = records.find((r) => r.tooth_number === toothNum);
    if (existing) {
      setForm({ status: existing.status, treatment_type: existing.treatment_type || '', notes: existing.notes || '' });
    } else {
      setForm({ status: 'decayed', treatment_type: '', notes: '' });
    }
  }

  if (loading) {
    return <Skeleton className="h-64" />;
  }

  const renderRow = (teeth: number[][]) => (
    <div className="flex justify-center gap-2">
      {teeth.map((group, gi) => (
        <div key={gi} className="flex gap-0.5">
          {group.map((tooth) => {
            const status = getToothStatus(tooth);
            const hasRecord = records.some((r) => r.tooth_number === tooth);
            return (
              <button
                key={tooth}
                onClick={() => openTooth(tooth)}
                title={`دندان ${formatNumber(tooth)} - ${toothStatus[status].label}`}
                className={`w-7 h-8 rounded-lg border-2 flex items-end justify-center pb-0.5 text-[9px] font-medium text-surface-600 shadow-xs cursor-pointer transition-all duration-150 hover:scale-110 hover:brightness-95 ${
                  selectedTooth === tooth ? 'ring-2 ring-primary-400 ring-offset-1' : ''
                }`}
                style={{ backgroundColor: toothStatus[status].color, borderColor: hasRecord ? '#0891b2' : '#e2e8f0' }}
              >
                {formatNumber(tooth)}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  const selectedRecord = selectedTooth !== null ? records.find((r) => r.tooth_number === selectedTooth) : undefined;

  return (
    <div className="card p-5">
      <SectionHeader title="نمودار دندانی" note="برای ثبت وضعیت روی دندان کلیک کنید" />

      <div className="bg-surface-50 rounded-2xl p-4 mb-4 overflow-x-auto">
        <div className="min-w-max">
          <div className="text-xs text-center text-surface-400 mb-3 font-medium">فک بالا</div>
          {renderRow(upperTeeth)}
          <div className="border-t-2 border-dashed border-surface-300 my-3" />
          {renderRow(lowerTeeth)}
          <div className="text-xs text-center text-surface-400 mt-3 font-medium">فک پایین</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-2 mb-4">
        {toothStatuses.map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-surface-600">
            <span className="w-3.5 h-3.5 rounded-sm border border-surface-200 inline-block" style={{ backgroundColor: toothStatus[key].color }} />
            {toothStatus[key].label}
          </div>
        ))}
      </div>

      {selectedTooth !== null && (
        <div className="bg-white border border-primary-200 rounded-2xl p-4 shadow-card mb-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-surface-700 mb-3">دندان {formatNumber(selectedTooth)}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label-field">وضعیت</label>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ToothStatus })}>
                {toothStatuses.map((key) => (
                  <option key={key} value={key}>{toothStatus[key].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">نوع درمان</label>
              <select className="input-field" value={form.treatment_type} onChange={(e) => setForm({ ...form, treatment_type: e.target.value })}>
                <option value="">-- انتخاب خدمت --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label-field">یادداشت</label>
              <input className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="یادداشت اختیاری" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={saveRecord} className="btn-primary flex-1">ذخیره</button>
            <button onClick={() => setSelectedTooth(null)} className="btn-secondary flex-1">انصراف</button>
          </div>
          {selectedRecord?.treatment_date && (
            <p className="text-xs text-surface-400 mt-3 pt-3 border-t border-surface-100">
              آخرین ثبت: {formatDate(selectedRecord.treatment_date)}
              {selectedRecord.treatment_type && <> · {selectedRecord.treatment_type}</>}
            </p>
          )}
        </div>
      )}

      {records.length > 0 && (
        <div className="pt-4 border-t border-surface-100">
          <p className="text-xs font-medium text-surface-600 mb-2">سابقه ثبت‌شده</p>
          <div className="space-y-1">
            {records.map((record) => {
              const sc = toothStatus[record.status] ?? toothStatus.healthy;
              return (
                <div key={record.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-50 text-sm">
                  <span className="text-surface-400 text-xs w-20 shrink-0">{record.treatment_date ? formatDateNumeric(record.treatment_date) : '—'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-surface-700 truncate">
                      دندان {formatNumber(record.tooth_number)}
                      {record.treatment_type && <span className="text-surface-400"> · {record.treatment_type}</span>}
                    </p>
                    {record.notes && <p className="text-xs text-surface-400 truncate">{record.notes}</p>}
                  </div>
                  <StatusBadge status={sc} />
                  <button onClick={() => deleteRecord(record.tooth_number)} title="حذف" className="p-1.5 rounded-lg text-surface-400 hover:bg-error-50 hover:text-error-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
