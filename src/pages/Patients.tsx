import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Heart,
  FileText,
  Image,
  FlaskConical,
  Smile,
  ClipboardList,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import * as db from '@/lib/store';
import { formatCurrency, formatDate, formatNumber, getAge, getInitials } from '@/lib/format';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/Toast';
import { DentalChart } from '@/components/DentalChart';
import type { Patient, Treatment, DentalRecord, RvgImage, LabOrder, TreatmentPlan, TreatmentPlanItem, PageKey, Service, Staff } from '@/lib/types';

interface PatientsProps {
  selectedPatientId: string | null;
  onNavigate: (page: PageKey) => void;
}

type TabKey = 'info' | 'dental' | 'rvg' | 'lab' | 'history' | 'plan';

export function Patients({ selectedPatientId }: PatientsProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('info');

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
      const p = patients.find((p) => p.id === selectedPatientId);
      if (p) setDetailPatient(p);
      else {
        const found = db.get('patients', selectedPatientId);
        if (found) setDetailPatient(found);
      }
    }
  }, [selectedPatientId, patients]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-surface-800">مدیریت بیماران</h1>
          <p className="text-sm text-surface-400 mt-1">{formatNumber(patients.length)} بیمار ثبت شده</p>
        </div>
        <button
          onClick={() => { setEditingPatient(null); setShowForm(true); }}
          className="btn-primary"
        >
          <Plus size={18} />
          بیمار جدید
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white rounded-xl border border-surface-200 px-4 py-2.5 shadow-card">
        <Search size={18} className="text-surface-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو با نام، تلفن یا کد ملی..."
          className="bg-transparent text-sm outline-none flex-1 text-surface-700 placeholder:text-surface-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="p-1 rounded-lg hover:bg-surface-100">
            <X size={16} className="text-surface-400" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-surface-100 animate-pulse-soft" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="هیچ بیماری یافت نشد"
          description={search ? 'عبارت جستجو را تغییر دهید' : 'اولین بیمار خود را ثبت کنید'}
          action={
            <button onClick={() => { setEditingPatient(null); setShowForm(true); }} className="btn-primary">
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-primary-700 font-bold text-base shrink-0">
                  {getInitials(patient.first_name, patient.last_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-surface-800 text-sm truncate">
                    {patient.first_name} {patient.last_name}
                  </h3>
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
          onUpdated={loadPatients}
        />
      )}
    </div>
  );
}

function PatientForm({ patient, onClose, onSaved }: {
  patient: Patient | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    first_name: patient?.first_name || '',
    last_name: patient?.last_name || '',
    phone: patient?.phone || '',
    national_id: patient?.national_id || '',
    birth_date: patient?.birth_date || '',
    gender: patient?.gender || 'male',
    email: patient?.email || '',
    address: patient?.address || '',
    blood_type: patient?.blood_type || '',
    allergies: patient?.allergies || '',
    medical_history: patient?.medical_history || '',
    emergency_contact: patient?.emergency_contact || '',
    emergency_phone: patient?.emergency_phone || '',
    insurance_company: patient?.insurance_company || '',
    insurance_number: patient?.insurance_number || '',
    notes: patient?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  function handleSave() {
    if (!form.first_name || !form.last_name || !form.phone) {
      showToast('نام، نام خانوادگی و تلفن الزامی است', 'error');
      return;
    }
    setSaving(true);
    // Optional fields left blank are stored as null, not ''.
    const values = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value === '' ? null : value]),
    ) as unknown as db.Patch<'patients'>;
    if (patient) {
      db.update('patients', patient.id, values);
      showToast('بیمار بروزرسانی شد');
    } else {
      db.insert('patients', values);
      showToast('بیمار جدید ثبت شد');
    }
    onSaved();
    setSaving(false);
  }

  return (
    <Modal open onClose={onClose} title={patient ? 'ویرایش بیمار' : 'بیمار جدید'} size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-field">نام *</label>
            <input className="input-field" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <label className="label-field">نام خانوادگی *</label>
            <input className="input-field" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
          <div>
            <label className="label-field">تلفن *</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label-field">کد ملی</label>
            <input className="input-field" value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
          </div>
          <div>
            <label className="label-field">تاریخ تولد</label>
            <input type="date" className="input-field" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
          </div>
          <div>
            <label className="label-field">جنسیت</label>
            <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="male">آقا</option>
              <option value="female">خانم</option>
            </select>
          </div>
          <div>
            <label className="label-field">ایمیل</label>
            <input className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label-field">گروه خونی</label>
            <select className="input-field" value={form.blood_type} onChange={(e) => setForm({ ...form, blood_type: e.target.value })}>
              <option value="">نامشخص</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label-field">آدرس</label>
          <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>

        <div className="border-t border-surface-100 pt-4">
          <h4 className="font-semibold text-surface-700 text-sm mb-3">اطلاعات پزشکی</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">آلرژی‌ها</label>
              <input className="input-field" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="مثلا: پنی‌سیلین" />
            </div>
            <div>
              <label className="label-field">بیماری‌های زمینه‌ای</label>
              <input className="input-field" value={form.medical_history} onChange={(e) => setForm({ ...form, medical_history: e.target.value })} placeholder="مثلا: دیابت" />
            </div>
            <div>
              <label className="label-field">تماس اضطراری</label>
              <input className="input-field" value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
            </div>
            <div>
              <label className="label-field">تلفن اضطراری</label>
              <input className="input-field" value={form.emergency_phone} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="border-t border-surface-100 pt-4">
          <h4 className="font-semibold text-surface-700 text-sm mb-3">اطلاعات بیمه</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">شرکت بیمه</label>
              <input className="input-field" value={form.insurance_company} onChange={(e) => setForm({ ...form, insurance_company: e.target.value })} />
            </div>
            <div>
              <label className="label-field">شماره بیمه</label>
              <input className="input-field" value={form.insurance_number} onChange={(e) => setForm({ ...form, insurance_number: e.target.value })} />
            </div>
          </div>
        </div>

        <div>
          <label className="label-field">یادداشت</label>
          <textarea className="input-field min-h-[80px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">انصراف</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'در حال ذخیره...' : patient ? 'بروزرسانی' : 'ثبت بیمار'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PatientDetail({ patient, activeTab, onTabChange, onClose, onEdit, onUpdated }: {
  patient: Patient;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onClose: () => void;
  onEdit: () => void;
  onUpdated: () => void;
}) {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'اطلاعات کلی', icon: <FileText size={16} /> },
    { key: 'dental', label: 'نمودار دندان', icon: <Smile size={16} /> },
    { key: 'rvg', label: 'تصاویر RVG', icon: <Image size={16} /> },
    { key: 'lab', label: 'سفارشات لابراتوار', icon: <FlaskConical size={16} /> },
    { key: 'history', label: 'سابقه درمان', icon: <Calendar size={16} /> },
    { key: 'plan', label: 'طرح درمان', icon: <ClipboardList size={16} /> },
  ];

  return (
    <Modal open onClose={onClose} title={`${patient.first_name} ${patient.last_name}`} size="xl">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-surface-50 rounded-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-primary-700 font-bold text-xl shrink-0">
            {getInitials(patient.first_name, patient.last_name)}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-surface-800 text-lg">{patient.first_name} {patient.last_name}</h3>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-surface-500">
              <span className="flex items-center gap-1"><Phone size={12} /> {patient.phone}</span>
              {patient.birth_date && <span>{formatNumber(getAge(patient.birth_date))} ساله</span>}
              {patient.insurance_company && <span className="badge bg-secondary-50 text-secondary-600">{patient.insurance_company}</span>}
              {patient.balance > 0 && <span className="badge bg-error-50 text-error-600">بدهی: {formatCurrency(patient.balance)}</span>}
            </div>
          </div>
          <button onClick={onEdit} className="btn-secondary">
            <Edit3 size={16} />
            ویرایش
          </button>
        </div>

        {patient.allergies && (
          <div className="flex items-center gap-2 px-4 py-3 bg-warning-50 border border-warning-200 rounded-xl">
            <AlertCircle size={18} className="text-warning-500" />
            <span className="text-sm font-medium text-warning-700">آلرژی: {patient.allergies}</span>
          </div>
        )}

        <div className="flex items-center gap-1 border-b border-surface-100 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-surface-400 hover:text-surface-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'info' && <PatientInfoTab patient={patient} />}
        {activeTab === 'dental' && <DentalChart patientId={patient.id} />}
        {activeTab === 'rvg' && <RvgManager patientId={patient.id} />}
        {activeTab === 'lab' && <PatientLabOrders patientId={patient.id} />}
        {activeTab === 'history' && <TreatmentHistory patientId={patient.id} />}
        {activeTab === 'plan' && <TreatmentPlanTab patientId={patient.id} />}
      </div>
    </Modal>
  );
}

function PatientInfoTab({ patient }: { patient: Patient }) {
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

function RvgManager({ patientId }: { patientId: string }) {
  const [images, setImages] = useState<RvgImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageDesc, setImageDesc] = useState('');
  const [toothNum, setToothNum] = useState('');

  const load = useCallback(() => {
    setImages(db.orderBy(db.list('rvg_images', (r) => r.patient_id === patientId), 'created_at', { ascending: false }));
    setLoading(false);
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  function addImage() {
    if (!imageUrl) { showToast('آدرس تصویر را وارد کنید', 'error'); return; }
    db.insert('rvg_images', {
      patient_id: patientId,
      image_url: imageUrl,
      description: imageDesc || null,
      tooth_number: toothNum ? parseInt(toothNum) : null,
      image_type: 'rvg',
    });
    showToast('تصویر ثبت شد');
    setImageUrl('');
    setImageDesc('');
    setToothNum('');
    setShowAdd(false);
    load();
  }

  function deleteImage(id: string) {
    db.remove('rvg_images', id);
    showToast('تصویر حذف شد');
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">{formatNumber(images.length)} تصویر ثبت شده</p>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          <Plus size={16} />
          افزودن تصویر
        </button>
      </div>

      {showAdd && (
        <div className="p-4 bg-surface-50 rounded-xl space-y-3 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label-field">آدرس تصویر</label>
              <input className="input-field" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="label-field">شماره دندان</label>
              <input type="number" className="input-field" value={toothNum} onChange={(e) => setToothNum(e.target.value)} placeholder="مثلا: ۱۸" />
            </div>
            <div>
              <label className="label-field">توضیحات</label>
              <input className="input-field" value={imageDesc} onChange={(e) => setImageDesc(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={addImage} className="btn-primary">ثبت</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">انصراف</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-surface-50 rounded-xl animate-pulse-soft" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <EmptyState icon={Image} title="هیچ تصویری ثبت نشده" description="تصاویر رادیولوژی بیمار را اینجا اضافه کنید" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-xl border border-surface-100 bg-surface-50">
              <img src={img.image_url} alt={img.description || 'RVG'} className="w-full h-40 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white text-xs font-medium">{img.description || 'تصویر RVG'}</p>
                {img.tooth_number && <p className="text-white/70 text-[11px]">دندان شماره {formatNumber(img.tooth_number)}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <a href={img.image_url} target="_blank" rel="noreferrer" className="px-2.5 py-1 bg-white/20 text-white text-xs rounded-lg hover:bg-white/30">مشاهده</a>
                  <button onClick={() => deleteImage(img.id)} className="px-2.5 py-1 bg-error-500/80 text-white text-xs rounded-lg hover:bg-error-500">حذف</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PatientLabOrders({ patientId }: { patientId: string }) {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const rows = db.orderBy(db.list('lab_orders', (o) => o.patient_id === patientId), 'created_at', { ascending: false });
    setOrders(db.withOne(rows, 'lab', 'labs', 'lab_id'));
    setLoading(false);
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  const statusConfig = {
    pending: { label: 'در انتظار', bg: 'bg-warning-50', text: 'text-warning-600' },
    in_progress: { label: 'در حال ساخت', bg: 'bg-secondary-50', text: 'text-secondary-600' },
    ready: { label: 'آماده', bg: 'bg-accent-50', text: 'text-accent-600' },
    delivered: { label: 'تحویل شده', bg: 'bg-surface-100', text: 'text-surface-500' },
  };

  if (loading) return <div className="h-32 bg-surface-50 rounded-xl animate-pulse-soft" />;
  if (orders.length === 0) return <EmptyState icon={FlaskConical} title="هیچ سفارش لابراتوار" description="سفارشات لابراتوار این بیمار اینجا نمایش داده می‌شود" />;

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const sc = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
        return (
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
            <span className={`badge ${sc.bg} ${sc.text}`}>{sc.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function TreatmentHistory({ patientId }: { patientId: string }) {
  const [treatments, setTreatments] = useState<(Treatment & { service?: Service; staff?: Staff })[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ service_id: '', tooth_number: '', description: '', cost: '', notes: '' });

  const load = useCallback(() => {
    const rows = db.orderBy(db.list('treatments', (t) => t.patient_id === patientId), 'created_at', { ascending: false });
    setTreatments(db.withOne(db.withOne(rows, 'service', 'services', 'service_id'), 'staff', 'staff', 'staff_id'));
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    load();
    setServices(db.list('services', (s) => s.active));
    setStaffList(db.list('staff', (s) => s.active));
  }, [load]);

  function addTreatment() {
    const svc = services.find((s) => s.id === form.service_id);
    db.insert('treatments', {
      patient_id: patientId,
      service_id: form.service_id || null,
      tooth_number: form.tooth_number ? parseInt(form.tooth_number) : null,
      description: form.description || null,
      cost: form.cost ? parseFloat(form.cost) : svc?.default_price || 0,
      notes: form.notes || null,
      treatment_date: new Date().toISOString().split('T')[0],
      status: 'completed',
    });
    showToast('درمان ثبت شد');
    setForm({ service_id: '', tooth_number: '', description: '', cost: '', notes: '' });
    setShowAdd(false);
    load();
  }

  if (loading) return <div className="h-32 bg-surface-50 rounded-xl animate-pulse-soft" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">{formatNumber(treatments.length)} درمان ثبت شده</p>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          <Plus size={16} />
          افزودن درمان
        </button>
      </div>

      {showAdd && (
        <div className="p-4 bg-surface-50 rounded-xl space-y-3 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label-field">خدمت</label>
              <select className="input-field" value={form.service_id} onChange={(e) => {
                const svc = services.find((s) => s.id === e.target.value);
                setForm({ ...form, service_id: e.target.value, cost: svc ? String(svc.default_price) : form.cost });
              }}>
                <option value="">انتخاب خدمت</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.default_price)}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">شماره دندان</label>
              <input type="number" className="input-field" value={form.tooth_number} onChange={(e) => setForm({ ...form, tooth_number: e.target.value })} />
            </div>
            <div>
              <label className="label-field">هزینه (تومان)</label>
              <input type="number" className="input-field" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </div>
            <div>
              <label className="label-field">توضیحات</label>
              <input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label-field">یادداشت</label>
            <textarea className="input-field min-h-[60px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={addTreatment} className="btn-primary">ثبت درمان</button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary">انصراف</button>
          </div>
        </div>
      )}

      {treatments.length === 0 ? (
        <EmptyState icon={Calendar} title="هیچ درمانی ثبت نشده" />
      ) : (
        <div className="space-y-2">
          {treatments.map((t) => (
            <div key={t.id} className="flex items-start gap-3 p-4 bg-surface-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0">
                {t.tooth_number ? <Smile size={18} className="text-primary-500" /> : <FileText size={18} className="text-surface-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-surface-800 text-sm">
                  {t.service?.name || t.description || 'درمان'}
                  {t.tooth_number && <span className="text-surface-400"> • دندان {formatNumber(t.tooth_number)}</span>}
                </p>
                <p className="text-xs text-surface-400 mt-0.5">
                  {formatDate(t.treatment_date)} • {formatCurrency(t.cost)}
                </p>
                {t.notes && <p className="text-xs text-surface-500 mt-1">{t.notes}</p>}
              </div>
              <span className="badge bg-accent-50 text-accent-600">تکمیل شده</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TreatmentPlanTab({ patientId }: { patientId: string }) {
  const [plans, setPlans] = useState<(TreatmentPlan & { items?: TreatmentPlanItem[] })[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({ title: '', target_end_date: '', notes: '' });
  const [showItemForm, setShowItemForm] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ service_id: '', tooth_number: '', description: '', estimated_cost: '', due_date: '', notes: '' });

  const load = useCallback(() => {
    const rows = db.orderBy(db.list('treatment_plans', (p) => p.patient_id === patientId), 'created_at', { ascending: false });
    setPlans(db.withMany(rows, 'items', 'treatment_plan_items', 'plan_id').map((plan) => ({
      ...plan,
      items: db.withOne(plan.items, 'service', 'services', 'service_id'),
    })));
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    load();
    setServices(db.list('services', (s) => s.active));
  }, [load]);

  function createPlan() {
    if (!planForm.title) { showToast('عنوان طرح الزامی است', 'error'); return; }
    db.insert('treatment_plans', {
      patient_id: patientId,
      title: planForm.title,
      target_end_date: planForm.target_end_date || null,
      notes: planForm.notes || null,
      total_estimated_cost: 0,
      status: 'active',
    });
    showToast('طرح درمان ایجاد شد');
    setPlanForm({ title: '', target_end_date: '', notes: '' });
    setShowPlanForm(false);
    load();
  }

  function addItem(planId: string) {
    const svc = services.find((s) => s.id === itemForm.service_id);
    const cost = itemForm.estimated_cost ? parseFloat(itemForm.estimated_cost) : svc?.default_price || 0;
    db.insert('treatment_plan_items', {
      plan_id: planId,
      patient_id: patientId,
      service_id: itemForm.service_id || null,
      tooth_number: itemForm.tooth_number ? parseInt(itemForm.tooth_number) : null,
      description: itemForm.description || svc?.name || null,
      estimated_cost: cost,
      due_date: itemForm.due_date || null,
      notes: itemForm.notes || null,
      status: 'planned',
    });

    const plan = plans.find((p) => p.id === planId);
    const newTotal = (plan?.total_estimated_cost || 0) + cost;
    db.update('treatment_plans', planId, { total_estimated_cost: newTotal });

    showToast('آیتم اضافه شد');
    setItemForm({ service_id: '', tooth_number: '', description: '', estimated_cost: '', due_date: '', notes: '' });
    setShowItemForm(null);
    load();
  }

  function updateItemStatus(itemId: string, status: string) {
    const patch: db.Patch<'treatment_plan_items'> = { status: status as TreatmentPlanItem['status'] };
    if (status === 'completed') patch.completed_date = new Date().toISOString().split('T')[0];
    db.update('treatment_plan_items', itemId, patch);
    showToast('وضعیت بروزرسانی شد');
    load();
  }

  function deleteItem(itemId: string) {
    db.remove('treatment_plan_items', itemId);
    showToast('آیتم حذف شد');
    load();
  }

  function deletePlan(planId: string) {
    db.remove('treatment_plans', planId);
    showToast('طرح حذف شد');
    load();
  }

  const itemStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
    planned: { label: 'برنامه‌ریزی', bg: 'bg-primary-50', text: 'text-primary-600' },
    in_progress: { label: 'در حال انجام', bg: 'bg-warning-50', text: 'text-warning-600' },
    completed: { label: 'تکمیل شده', bg: 'bg-accent-50', text: 'text-accent-600' },
    cancelled: { label: 'لغو شده', bg: 'bg-error-50', text: 'text-error-600' },
  };

  if (loading) return <div className="h-32 bg-surface-50 rounded-xl animate-pulse-soft" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">{formatNumber(plans.length)} طرح درمان</p>
        <button onClick={() => setShowPlanForm(!showPlanForm)} className="btn-primary">
          <Plus size={16} />
          طرح درمان جدید
        </button>
      </div>

      {showPlanForm && (
        <div className="p-4 bg-surface-50 rounded-xl space-y-3 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label-field">عنوان طرح *</label>
              <input className="input-field" value={planForm.title} onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })} placeholder="مثلا: طرح ایمپلنت فک بالا" />
            </div>
            <div>
              <label className="label-field">تاریخ هدف تکمیل</label>
              <input type="date" className="input-field" value={planForm.target_end_date} onChange={(e) => setPlanForm({ ...planForm, target_end_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label-field">یادداشت</label>
            <textarea className="input-field min-h-[60px]" value={planForm.notes} onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={createPlan} className="btn-primary">ایجاد طرح</button>
            <button onClick={() => setShowPlanForm(false)} className="btn-secondary">انصراف</button>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <EmptyState icon={ClipboardList} title="هیچ طرح درمانی" description="طرح درمان جدید برای این بیمار ایجاد کنید" />
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const completed = plan.items?.filter((i) => i.status === 'completed').length || 0;
            const total = plan.items?.length || 0;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <div key={plan.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-surface-800 text-sm">{plan.title}</h4>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {formatNumber(total)} آیتم • {formatCurrency(plan.total_estimated_cost)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${plan.status === 'active' ? 'bg-primary-50 text-primary-600' : plan.status === 'completed' ? 'bg-accent-50 text-accent-600' : 'bg-surface-100 text-surface-500'}`}>
                      {plan.status === 'active' ? 'فعال' : plan.status === 'completed' ? 'تکمیل' : 'لغو'}
                    </span>
                    <button onClick={() => deletePlan(plan.id)} className="p-1.5 rounded-lg hover:bg-error-50">
                      <Trash2 size={14} className="text-surface-400 hover:text-error-500" />
                    </button>
                  </div>
                </div>

                {total > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-surface-400">پیشرفت: {formatNumber(completed)} از {formatNumber(total)}</span>
                      <span className="text-xs font-medium text-primary-600">{formatNumber(progress)}%</span>
                    </div>
                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-primary-500 to-primary-300 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {plan.items?.map((item) => {
                    const sc = itemStatusConfig[item.status] || itemStatusConfig.planned;
                    return (
                      <div key={item.id} className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
                          {item.tooth_number ? <Smile size={16} className="text-primary-500" /> : <ClipboardList size={16} className="text-surface-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-surface-700">
                            {item.service?.name || item.description || 'آیتم'}
                            {item.tooth_number && <span className="text-surface-400"> • دندان {formatNumber(item.tooth_number)}</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-surface-400">{formatCurrency(item.estimated_cost)}</span>
                            {item.due_date && <span className="text-xs text-surface-400">• موعد: {formatDate(item.due_date)}</span>}
                          </div>
                          {item.notes && <p className="text-xs text-surface-500 mt-1">{item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          {item.status === 'planned' && (
                            <button onClick={() => updateItemStatus(item.id, 'in_progress')} className="px-2 py-1 rounded-lg bg-warning-50 text-warning-600 text-xs hover:bg-warning-100">شروع</button>
                          )}
                          {item.status === 'in_progress' && (
                            <button onClick={() => updateItemStatus(item.id, 'completed')} className="px-2 py-1 rounded-lg bg-accent-50 text-accent-600 text-xs hover:bg-accent-100">تکمیل</button>
                          )}
                          <span className={`badge ${sc.bg} ${sc.text}`}>{sc.label}</span>
                          <button onClick={() => deleteItem(item.id)} className="p-1 rounded-lg hover:bg-error-50">
                            <Trash2 size={12} className="text-surface-400 hover:text-error-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {showItemForm === plan.id ? (
                  <div className="mt-3 p-4 bg-surface-50 rounded-xl space-y-3 animate-slide-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="label-field">خدمت</label>
                        <select className="input-field" value={itemForm.service_id} onChange={(e) => {
                          const svc = services.find((s) => s.id === e.target.value);
                          setItemForm({ ...itemForm, service_id: e.target.value, estimated_cost: svc ? String(svc.default_price) : itemForm.estimated_cost, description: svc?.name || itemForm.description });
                        }}>
                          <option value="">انتخاب</option>
                          {services.map((s) => <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.default_price)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label-field">شماره دندان</label>
                        <input type="number" className="input-field" value={itemForm.tooth_number} onChange={(e) => setItemForm({ ...itemForm, tooth_number: e.target.value })} />
                      </div>
                      <div>
                        <label className="label-field">هزینه (تومان)</label>
                        <input type="number" className="input-field" value={itemForm.estimated_cost} onChange={(e) => setItemForm({ ...itemForm, estimated_cost: e.target.value })} />
                      </div>
                      <div>
                        <label className="label-field">موعد انجام</label>
                        <input type="date" className="input-field" value={itemForm.due_date} onChange={(e) => setItemForm({ ...itemForm, due_date: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="label-field">توضیحات</label>
                      <input className="input-field" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => addItem(plan.id)} className="btn-primary text-sm">افزودن آیتم</button>
                      <button onClick={() => setShowItemForm(null)} className="btn-secondary text-sm">انصراف</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowItemForm(plan.id)} className="w-full mt-2 py-2 border border-dashed border-surface-200 rounded-xl text-sm text-surface-400 hover:border-primary-300 hover:text-primary-500 transition-colors">
                    <Plus size={14} className="inline ml-1" />
                    افزودن آیتم
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}