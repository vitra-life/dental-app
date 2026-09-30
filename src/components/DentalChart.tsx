import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Smile } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { showToast } from '@/components/ui/Toast';
import type { DentalRecord, Service } from '@/lib/types';

interface DentalChartProps {
  patientId: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; text: string }> = {
  healthy: { label: 'سالم', color: 'text-accent-600', text: 'text-accent-600', bg: 'bg-accent-50', border: 'border-accent-200' },
  treated: { label: 'درمان شده', color: 'text-secondary-600', text: 'text-secondary-600', bg: 'bg-secondary-50', border: 'border-secondary-200' },
  in_progress: { label: 'در حال درمان', color: 'text-warning-600', text: 'text-warning-600', bg: 'bg-warning-50', border: 'border-warning-200' },
  planned: { label: 'برنامه‌ریزی شده', color: 'text-primary-600', text: 'text-primary-600', bg: 'bg-primary-50', border: 'border-primary-200' },
  extracted: { label: 'کشیده شده', color: 'text-surface-500', text: 'text-surface-500', bg: 'bg-surface-100', border: 'border-surface-200' },
  decayed: { label: 'پوسیده', color: 'text-error-600', text: 'text-error-600', bg: 'bg-error-50', border: 'border-error-200' },
};

const statusColors: Record<string, string> = {
  healthy: '#22c55e',
  treated: '#3b82f6',
  in_progress: '#f59e0b',
  planned: '#14b8a6',
  extracted: '#94a3b8',
  decayed: '#ef4444',
};

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export function DentalChart({ patientId }: DentalChartProps) {
  const [records, setRecords] = useState<DentalRecord[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ status: 'decayed', treatment_type: '', notes: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('dental_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    setRecords(data || []);
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    load();
    supabase.from('services').select('*').eq('active', true).then(({ data }) => setServices(data || []));
  }, [load]);

  function getToothStatus(toothNum: number): string {
    const record = records.find((r) => r.tooth_number === toothNum);
    return record?.status || 'healthy';
  }

  async function saveRecord() {
    if (selectedTooth === null) return;
    const existing = records.find((r) => r.tooth_number === selectedTooth);
    if (existing) {
      const { error } = await supabase
        .from('dental_records')
        .update({
          status: form.status,
          treatment_type: form.treatment_type || null,
          notes: form.notes || null,
          treatment_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', existing.id);
      if (error) showToast('خطا در بروزرسانی', 'error');
      else showToast('نمودار دندان بروزرسانی شد');
    } else {
      const { error } = await supabase.from('dental_records').insert({
        patient_id: patientId,
        tooth_number: selectedTooth,
        status: form.status,
        treatment_type: form.treatment_type || null,
        notes: form.notes || null,
        treatment_date: new Date().toISOString().split('T')[0],
      });
      if (error) showToast('خطا در ثبت', 'error');
      else showToast('درمان دندان ثبت شد');
    }
    setShowModal(false);
    setForm({ status: 'decayed', treatment_type: '', notes: '' });
    load();
  }

  async function deleteRecord(toothNum: number) {
    const { error } = await supabase
      .from('dental_records')
      .delete()
      .eq('patient_id', patientId)
      .eq('tooth_number', toothNum);
    if (error) showToast('خطا در حذف', 'error');
    else { showToast('رکورد حذف شد'); load(); }
  }

  function openTooth(toothNum: number) {
    setSelectedTooth(toothNum);
    const existing = records.find((r) => r.tooth_number === toothNum);
    if (existing) {
      setForm({ status: existing.status, treatment_type: existing.treatment_type || '', notes: existing.notes || '' });
    } else {
      setForm({ status: 'decayed', treatment_type: '', notes: '' });
    }
    setShowModal(true);
  }

  if (loading) {
    return <div className="h-64 bg-surface-50 rounded-xl animate-pulse-soft" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-50 rounded-xl">
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors[key] }} />
            <span className="text-xs text-surface-600">{cfg.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-surface-100 p-4 lg:p-6">
        <div className="text-center mb-2">
          <span className="text-xs font-medium text-surface-400">فک بالا</span>
        </div>
        <div className="flex justify-center gap-1 lg:gap-2 mb-6">
          {upperTeeth.map((tooth) => {
            const status = getToothStatus(tooth);
            const color = statusColors[status];
            return (
              <button
                key={tooth}
                onClick={() => openTooth(tooth)}
                className="group relative flex flex-col items-center"
              >
                <div
                  className="w-7 h-9 lg:w-9 lg:h-12 rounded-t-full rounded-b-sm border-2 transition-all duration-200 hover:scale-110 hover:shadow-md"
                  style={{
                    backgroundColor: color + '20',
                    borderColor: color,
                  }}
                >
                  <div
                    className="w-full h-full rounded-t-full rounded-b-sm opacity-30"
                    style={{ backgroundColor: color }}
                  />
                </div>
                <span className="text-[9px] lg:text-[10px] text-surface-400 mt-0.5">{formatNumber(tooth)}</span>
              </button>
            );
          })}
        </div>

        <div className="h-px bg-surface-200 mb-6" />

        <div className="flex justify-center gap-1 lg:gap-2 mb-2">
          {lowerTeeth.map((tooth) => {
            const status = getToothStatus(tooth);
            const color = statusColors[status];
            return (
              <button
                key={tooth}
                onClick={() => openTooth(tooth)}
                className="group relative flex flex-col items-center"
              >
                <span className="text-[9px] lg:text-[10px] text-surface-400 mb-0.5">{formatNumber(tooth)}</span>
                <div
                  className="w-7 h-9 lg:w-9 lg:h-12 rounded-b-full rounded-t-sm border-2 transition-all duration-200 hover:scale-110 hover:shadow-md"
                  style={{
                    backgroundColor: color + '20',
                    borderColor: color,
                  }}
                >
                  <div
                    className="w-full h-full rounded-b-full rounded-t-sm opacity-30"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </button>
            );
          })}
        </div>
        <div className="text-center mt-2">
          <span className="text-xs font-medium text-surface-400">فک پایین</span>
        </div>
      </div>

      {records.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-surface-700 text-sm">تاریخچه درمان‌ها</h4>
          {records.map((record) => {
            const sc = statusConfig[record.status] || statusConfig.healthy;
            return (
              <div key={record.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
                  <Smile size={16} style={{ color: statusColors[record.status] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-700">
                    دندان {formatNumber(record.tooth_number)}
                    {record.treatment_type && <span className="text-surface-400"> • {record.treatment_type}</span>}
                  </p>
                  {record.notes && <p className="text-xs text-surface-400 mt-0.5">{record.notes}</p>}
                  {record.treatment_date && <p className="text-xs text-surface-400">{formatDate(record.treatment_date)}</p>}
                </div>
                <span className={`badge ${sc.bg} ${sc.text}`}>{sc.label}</span>
                <button onClick={() => deleteRecord(record.tooth_number)} className="p-1.5 rounded-lg hover:bg-error-50">
                  <Trash2 size={14} className="text-surface-400 hover:text-error-500" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showModal && selectedTooth !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Smile size={20} className="text-primary-500" />
                </div>
                <div>
                  <h3 className="font-bold text-surface-800">دندان {formatNumber(selectedTooth)}</h3>
                  <p className="text-xs text-surface-400">ثبت وضعیت درمانی</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-surface-100">
                <X size={18} className="text-surface-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-field">وضعیت دندان</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setForm({ ...form, status: key })}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                        form.status === key
                          ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                          : 'bg-white border-surface-100 text-surface-400 hover:border-surface-200'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-field">نوع درمان</label>
                <select
                  className="input-field"
                  value={form.treatment_type}
                  onChange={(e) => setForm({ ...form, treatment_type: e.target.value })}
                >
                  <option value="">انتخاب...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-field">یادداشت</label>
                <textarea
                  className="input-field min-h-[70px]"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="توضیحات درمان..."
                />
              </div>

              <div className="flex items-center gap-2">
                <button onClick={saveRecord} className="btn-primary flex-1">
                  <Plus size={16} />
                  ثبت
                </button>
                <button onClick={() => setShowModal(false)} className="btn-secondary">انصراف</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
