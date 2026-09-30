import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Building2, Clock, Bell, User, Plus, Trash2, ClipboardList } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/ui/Toast';
import type { ClinicSettings, Staff, Service, TreatmentPlan } from '@/lib/types';
import { formatCurrency, formatNumber, formatDate } from '@/lib/format';

export function Settings() {
  const [tab, setTab] = useState<'clinic' | 'staff' | 'services' | 'plans' | 'notifications'>('clinic');
  const [clinic, setClinic] = useState<ClinicSettings | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [plans, setPlans] = useState<(TreatmentPlan & { patient?: { first_name: string; last_name: string }; items?: { id: string; status: string }[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [clinicRes, staffRes, svcRes, plansRes] = await Promise.all([
        supabase.from('clinic_settings').select('*').maybeSingle(),
        supabase.from('staff').select('*').order('full_name'),
        supabase.from('services').select('*').order('name'),
        supabase.from('treatment_plans').select('*, patient:patients(first_name, last_name), items:treatment_plan_items(id, status)').order('created_at', { ascending: false }),
      ]);
      setClinic(clinicRes.data as ClinicSettings);
      setStaff(staffRes.data || []);
      setServices(svcRes.data || []);
      setPlans(plansRes.data || []);
      setLoading(false);
    })();
  }, []);

  async function saveClinic() {
    if (!clinic) return;
    setSaving(true);
    const { error } = await supabase.from('clinic_settings').update({
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      email: clinic.email,
      tax_rate: clinic.tax_rate,
    }).eq('id', clinic.id);
    if (error) showToast('خطا در ذخیره', 'error');
    else showToast('تنظیمات ذخیره شد');
    setSaving(false);
  }

  async function addStaff() {
    const { data, error } = await supabase.from('staff').insert({
      full_name: 'نام جدید',
      role: 'dentist',
      color: '#3b82f6',
    }).select().single();
    if (error) showToast('خطا در افزودن', 'error');
    else { setStaff([...staff, data]); showToast('عضو جدید اضافه شد'); }
  }

  async function updateStaff(s: Staff) {
    const { error } = await supabase.from('staff').update({
      full_name: s.full_name,
      role: s.role,
      phone: s.phone,
      color: s.color,
      active: s.active,
    }).eq('id', s.id);
    if (error) showToast('خطا', 'error');
    else showToast('بروزرسانی شد');
  }

  async function deleteStaff(id: string) {
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) showToast('خطا در حذف', 'error');
    else { setStaff(staff.filter((s) => s.id !== id)); showToast('حذف شد'); }
  }

  async function addService() {
    const { data, error } = await supabase.from('services').insert({
      name: 'خدمت جدید',
      category: 'general',
      default_price: 0,
      duration_minutes: 30,
    }).select().single();
    if (error) showToast('خطا در افزودن', 'error');
    else { setServices([...services, data]); showToast('خدمت جدید اضافه شد'); }
  }

  async function updateService(s: Service) {
    const { error } = await supabase.from('services').update({
      name: s.name,
      category: s.category,
      default_price: s.default_price,
      duration_minutes: s.duration_minutes,
      active: s.active,
    }).eq('id', s.id);
    if (error) showToast('خطا', 'error');
    else showToast('بروزرسانی شد');
  }

  async function deleteService(id: string) {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) showToast('خطا در حذف', 'error');
    else { setServices(services.filter((s) => s.id !== id)); showToast('حذف شد'); }
  }

  const tabs = [
    { key: 'clinic' as const, label: 'اطلاعات کلینیک', icon: <Building2 size={16} /> },
    { key: 'staff' as const, label: 'پرسنل', icon: <User size={16} /> },
    { key: 'services' as const, label: 'خدمات', icon: <SettingsIcon size={16} /> },
    { key: 'plans' as const, label: 'طرح‌های درمان', icon: <ClipboardList size={16} /> },
    { key: 'notifications' as const, label: 'اعلان‌ها', icon: <Bell size={16} /> },
  ];

  if (loading) {
    return <div className="h-64 bg-white rounded-2xl border border-surface-100 animate-pulse-soft" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-surface-800">تنظیمات</h1>
        <p className="text-sm text-surface-400 mt-1">مدیریت اطلاعات کلینیک و سیستم</p>
      </div>

      <div className="flex items-center gap-1 border-b border-surface-100 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              tab === t.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-surface-400 hover:text-surface-600'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'clinic' && clinic && (
        <div className="card p-6 space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">نام کلینیک</label>
              <input className="input-field" value={clinic.name} onChange={(e) => setClinic({ ...clinic, name: e.target.value })} />
            </div>
            <div>
              <label className="label-field">تلفن</label>
              <input className="input-field" value={clinic.phone || ''} onChange={(e) => setClinic({ ...clinic, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label-field">آدرس</label>
            <input className="input-field" value={clinic.address || ''} onChange={(e) => setClinic({ ...clinic, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">ایمیل</label>
              <input className="input-field" value={clinic.email || ''} onChange={(e) => setClinic({ ...clinic, email: e.target.value })} />
            </div>
            <div>
              <label className="label-field">نرخ مالیات (٪)</label>
              <input type="number" className="input-field" value={clinic.tax_rate} onChange={(e) => setClinic({ ...clinic, tax_rate: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <button onClick={saveClinic} disabled={saving} className="btn-primary">
            <Save size={18} />
            {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
        </div>
      )}

      {tab === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-500">{formatNumber(staff.length)} عضو</p>
            <button onClick={addStaff} className="btn-primary"><Plus size={18} />افزودن عضو</button>
          </div>
          <div className="space-y-3">
            {staff.map((s) => (
              <div key={s.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: s.color }}>
                    {s.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input className="input-field" value={s.full_name} onChange={(e) => setStaff(staff.map((st) => st.id === s.id ? { ...st, full_name: e.target.value } : st))} placeholder="نام" />
                    <select className="input-field" value={s.role} onChange={(e) => setStaff(staff.map((st) => st.id === s.id ? { ...st, role: e.target.value as Staff['role'] } : st))}>
                      <option value="dentist">دندانپزشک</option>
                      <option value="receptionist">منشی</option>
                      <option value="accountant">حسابدار</option>
                      <option value="manager">مدیر</option>
                    </select>
                    <input className="input-field" value={s.phone || ''} onChange={(e) => setStaff(staff.map((st) => st.id === s.id ? { ...st, phone: e.target.value } : st))} placeholder="تلفن" />
                    <div className="flex items-center gap-2">
                      <input type="color" className="w-10 h-10 rounded-lg border border-surface-200" value={s.color} onChange={(e) => setStaff(staff.map((st) => st.id === s.id ? { ...st, color: e.target.value } : st))} />
                      <button onClick={() => updateStaff(s)} className="btn-secondary text-xs">ذخیره</button>
                      <button onClick={() => deleteStaff(s.id)} className="p-2 rounded-lg hover:bg-error-50"><Trash2 size={16} className="text-error-400" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-500">{formatNumber(services.length)} خدمت</p>
            <button onClick={addService} className="btn-primary"><Plus size={18} />افزودن خدمت</button>
          </div>
          <div className="space-y-3">
            {services.map((s) => (
              <div key={s.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input className="input-field" value={s.name} onChange={(e) => setServices(services.map((sv) => sv.id === s.id ? { ...sv, name: e.target.value } : sv))} placeholder="نام خدمت" />
                    <select className="input-field" value={s.category} onChange={(e) => setServices(services.map((sv) => sv.id === s.id ? { ...sv, category: e.target.value } : sv))}>
                      <option value="general">عمومی</option>
                      <option value="endodontics">اندودنتیکس</option>
                      <option value="surgery">جراحی</option>
                      <option value="prosthodontics">پروتز</option>
                      <option value="cosmetic">زیبایی</option>
                      <option value="orthodontics">ارتودنسی</option>
                    </select>
                    <input type="number" className="input-field" value={s.default_price} onChange={(e) => setServices(services.map((sv) => sv.id === s.id ? { ...sv, default_price: parseFloat(e.target.value) || 0 } : sv))} placeholder="قیمت" />
                    <div className="flex items-center gap-2">
                      <input type="number" className="input-field w-20" value={s.duration_minutes} onChange={(e) => setServices(services.map((sv) => sv.id === s.id ? { ...sv, duration_minutes: parseInt(e.target.value) || 30 } : sv))} placeholder="دقیقه" />
                      <button onClick={() => updateService(s)} className="btn-secondary text-xs">ذخیره</button>
                      <button onClick={() => deleteService(s.id)} className="p-2 rounded-lg hover:bg-error-50"><Trash2 size={16} className="text-error-400" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-surface-500">{formatNumber(plans.length)} طرح درمان</p>
          </div>
          {plans.length === 0 ? (
            <div className="card p-8 text-center">
              <ClipboardList size={32} className="text-surface-300 mx-auto mb-3" />
              <p className="text-sm text-surface-400">هنوز هیچ طرح درمانی ایجاد نشده است</p>
              <p className="text-xs text-surface-400 mt-1">طرح‌های درمان از پرونده بیمار ایجاد می‌شوند</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => {
                const total = plan.items?.length || 0;
                const completed = plan.items?.filter((i) => i.status === 'completed').length || 0;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={plan.id} className="card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-surface-800 text-sm">{plan.title}</p>
                        <p className="text-xs text-surface-400 mt-0.5">
                          {plan.patient ? `${plan.patient.first_name} ${plan.patient.last_name}` : 'نامشخص'} • {formatDate(plan.created_at)}
                        </p>
                      </div>
                      <span className={`badge ${plan.status === 'active' ? 'bg-primary-50 text-primary-600' : plan.status === 'completed' ? 'bg-accent-50 text-accent-600' : 'bg-surface-100 text-surface-500'}`}>
                        {plan.status === 'active' ? 'فعال' : plan.status === 'completed' ? 'تکمیل' : 'لغو'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-surface-500 mb-2">
                      <span>{formatNumber(completed)} از {formatNumber(total)} آیتم تکمیل شده</span>
                      <span className="font-medium text-primary-600">{formatNumber(progress)}%</span>
                    </div>
                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-primary-500 to-primary-300 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-surface-400">هزینه تخمینی: {formatCurrency(plan.total_estimated_cost)}</span>
                      {plan.target_end_date && <span className="text-xs text-surface-400">موعد: {formatDate(plan.target_end_date)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'notifications' && (
        <div className="card p-6 space-y-4 max-w-2xl">
          <div className="flex items-center gap-3 p-4 bg-surface-50 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Bell size={18} className="text-primary-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-surface-800 text-sm">یادآوری نوبت</p>
              <p className="text-xs text-surface-400 mt-0.5">ارسال خودکار یادآوری نوبت به بیماران</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary-500" />
          </div>
          <div className="flex items-center gap-3 p-4 bg-surface-50 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
              <Clock size={18} className="text-secondary-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-surface-800 text-sm">پیام تبریک تولد</p>
              <p className="text-xs text-surface-400 mt-0.5">ارسال خودکار پیام تبریک تولد به بیماران</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary-500" />
          </div>
          <div className="flex items-center gap-3 p-4 bg-surface-50 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
              <Bell size={18} className="text-accent-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-surface-800 text-sm">نظرخواهی بعد از درمان</p>
              <p className="text-xs text-surface-400 mt-0.5">ارسال فرم نظرخواهی پس از تکمیل درمان</p>
            </div>
            <input type="checkbox" className="w-5 h-5 accent-primary-500" />
          </div>
          <div className="flex items-center gap-3 p-4 bg-surface-50 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
              <Bell size={18} className="text-warning-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-surface-800 text-sm">یادآوری چکاپ</p>
              <p className="text-xs text-surface-400 mt-0.5">ارسال یادآوری چکاپ دوره‌ای (هر ۶ ماه)</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary-500" />
          </div>
          <button onClick={() => showToast('تنظیمات اعلان‌ها ذخیره شد')} className="btn-primary">
            <Save size={18} />
            ذخیره تنظیمات
          </button>
        </div>
      )}
    </div>
  );
}
