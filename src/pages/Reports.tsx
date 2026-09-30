import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  CalendarDays,
  Activity,
  Award,
  Clock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNumber, getPersianDayName } from '@/lib/format';

export function Reports() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalRevenue: 0,
    totalPatients: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    pendingPayments: 0,
    monthlyRevenue: [] as { month: string; amount: number }[],
    serviceStats: [] as { name: string; count: number; revenue: number }[],
    staffStats: [] as { name: string; appointments: number; color: string }[],
    weeklyData: [] as { day: string; appointments: number; revenue: number }[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [invRes, patRes, aptRes, svcRes, stfRes] = await Promise.all([
      supabase.from('invoices').select('total, paid_amount, balance, status, created_at'),
      supabase.from('patients').select('id, status'),
      supabase.from('appointments').select('id, status, price, staff_id, appointment_date, start_time'),
      supabase.from('services').select('id, name, default_price'),
      supabase.from('staff').select('id, full_name, color'),
    ]);

    const invoices = invRes.data || [];
    const patients = patRes.data || [];
    const appointments = aptRes.data || [];
    const services = svcRes.data || [];
    const staff = stfRes.data || [];

    const totalRevenue = invoices.reduce((s, i) => s + (i.paid_amount || 0), 0);
    const pendingPayments = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.balance || 0), 0);
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;

    // Monthly revenue (last 6 months)
    const monthlyRev: { month: string; amount: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(d);
      const amount = invoices
        .filter((inv) => {
          const id = new Date(inv.created_at);
          return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear();
        })
        .reduce((s, inv) => s + (inv.total || 0), 0);
      monthlyRev.push({ month: monthName, amount });
    }

    // Service stats
    const svcStats = services.slice(0, 6).map((svc) => {
      const count = appointments.filter((a) => a.status === 'completed').length;
      return { name: svc.name, count: Math.floor(count / (services.length || 1)), revenue: svc.default_price * Math.floor(count / (services.length || 1)) };
    });

    // Staff stats
    const stfStats = staff.map((s) => ({
      name: s.full_name,
      appointments: appointments.filter((a) => a.staff_id === s.id).length,
      color: s.color || '#3b82f6',
    }));

    // Weekly data
    const weekly: { day: string; appointments: number; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dayAppts = appointments.filter((a) => a.appointment_date === dateStr);
      weekly.push({
        day: getPersianDayName(d),
        appointments: dayAppts.length,
        revenue: dayAppts.filter((a) => a.status === 'completed').reduce((s, a) => s + (a.price || 0), 0),
      });
    }

    setData({
      totalRevenue,
      totalPatients: patients.length,
      totalAppointments: appointments.length,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
      pendingPayments,
      monthlyRevenue: monthlyRev,
      serviceStats: svcStats,
      staffStats: stfStats,
      weeklyData: weekly,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const maxMonthly = Math.max(...data.monthlyRevenue.map((m) => m.amount), 1);
  const maxWeeklyApts = Math.max(...data.weeklyData.map((w) => w.appointments), 1);
  const completionRate = data.totalAppointments > 0
    ? Math.round((data.completedAppointments / data.totalAppointments) * 100)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border border-surface-100 animate-pulse-soft" />)}
        </div>
        <div className="h-80 bg-white rounded-2xl border border-surface-100 animate-pulse-soft" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-surface-800">گزارش‌ها</h1>
        <p className="text-sm text-surface-400 mt-1">تحلیل عملکرد کلینیک</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'درآمد کل', value: formatCurrency(data.totalRevenue), icon: DollarSign, color: 'accent' as const },
          { label: 'بیماران', value: formatNumber(data.totalPatients), icon: Users, color: 'secondary' as const },
          { label: 'نوبت‌ها', value: formatNumber(data.totalAppointments), icon: CalendarDays, color: 'primary' as const },
          { label: 'مطالبات', value: formatCurrency(data.pendingPayments), icon: TrendingUp, color: 'warning' as const },
        ].map((stat, i) => {
          const colorMap = {
            accent: 'bg-accent-50 text-accent-500',
            secondary: 'bg-secondary-50 text-secondary-500',
            primary: 'bg-primary-50 text-primary-500',
            warning: 'bg-warning-50 text-warning-500',
          };
          const Icon = stat.icon;
          return (
            <div key={i} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-surface-500 mb-2">{stat.label}</p>
                  <p className="text-lg font-bold text-surface-800">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[stat.color]}`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-surface-800">درآمد ماهانه</h3>
            <p className="text-xs text-surface-400 mt-0.5">۶ ماه اخیر</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
            <BarChart3 className="text-accent-500" size={20} />
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 lg:gap-4 h-56">
          {data.monthlyRevenue.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full bg-gradient-to-t from-accent-500 to-accent-300 rounded-t-lg transition-all duration-500 group relative hover:from-accent-600 hover:to-accent-400"
                  style={{ height: `${(m.amount / maxMonthly) * 100}%`, minHeight: '12px' }}
                >
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-surface-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(m.amount)}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-surface-500 font-medium">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Appointments */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-surface-800">نوبت‌های هفته</h3>
              <p className="text-xs text-surface-400 mt-0.5">آمار هفتگی</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Activity className="text-primary-500" size={20} />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            {data.weeklyData.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-lg transition-all duration-500 group relative hover:from-primary-600 hover:to-primary-400"
                    style={{ height: `${(w.appointments / maxWeeklyApts) * 100}%`, minHeight: '8px' }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-surface-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatNumber(w.appointments)}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-surface-500 font-medium">{w.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Completion Rate */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-surface-800">نرخ تکمیل درمان</h3>
              <p className="text-xs text-surface-400 mt-0.5">درصد نوبت‌های تکمیل شده</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
              <Award className="text-accent-500" size={20} />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="#22c55e" strokeWidth="10"
                  strokeDasharray={`${(completionRate / 100) * 327} 327`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-surface-800">{formatNumber(completionRate)}%</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-accent-500" />
                <span className="text-xs text-surface-500">تکمیل: {formatNumber(data.completedAppointments)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-error-500" />
                <span className="text-xs text-surface-500">لغو: {formatNumber(data.cancelledAppointments)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Distribution */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-surface-800">پرکاربردترین خدمات</h3>
            <p className="text-xs text-surface-400 mt-0.5">آمار خدمات ارائه شده</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
            <Award className="text-secondary-500" size={20} />
          </div>
        </div>
        <div className="space-y-3">
          {data.serviceStats.map((svc, i) => {
            const maxCount = Math.max(...data.serviceStats.map((s) => s.count), 1);
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-surface-700 truncate">{svc.name}</span>
                    <span className="text-xs text-surface-400">{formatNumber(svc.count)} بار</span>
                  </div>
                  <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-primary-500 to-primary-300 rounded-full transition-all duration-500"
                      style={{ width: `${(svc.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-surface-600 whitespace-nowrap">{formatCurrency(svc.revenue)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff Performance */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-surface-800">عملکرد دندانپزشکان</h3>
            <p className="text-xs text-surface-400 mt-0.5">تعداد نوبت‌های هر پزشک</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <Users className="text-primary-500" size={20} />
          </div>
        </div>
        <div className="space-y-3">
          {data.staffStats.map((s, i) => {
            const maxApts = Math.max(...data.staffStats.map((st) => st.appointments), 1);
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: s.color }}>
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-surface-700">{s.name}</span>
                    <span className="text-xs text-surface-400">{formatNumber(s.appointments)} نوبت</span>
                  </div>
                  <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(s.appointments / maxApts) * 100}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
