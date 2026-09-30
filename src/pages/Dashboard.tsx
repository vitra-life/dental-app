import { useState, useEffect } from 'react';
import {
  Users,
  CalendarDays,
  DollarSign,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
  Activity,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNumber, formatTime, getPersianDayName } from '@/lib/format';
import type { Appointment, Patient, PageKey } from '@/lib/types';

interface DashboardProps {
  onNavigate: (page: PageKey) => void;
  onOpenPatient: (patientId: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    todayRevenue: 0,
    pendingPayments: 0,
  completedToday: 0,
    cancelledToday: 0,
  totalStaff: 0,
  activePatients: 0,
  labOrders: 0,
    totalServices: 0,
  monthlyRevenue: 0,
    lastMonthRevenue: 0,
  weeklyAppointments: [] as number[],
    revenueByDay: [] as { day: string; amount: number }[],
    serviceDistribution: [] as { name: string; count: number; color: string }[],
    recentAppointments: [] as (Appointment & { patient?: Patient })[],
    alerts: [] as { type: string; message: string; severity: 'warning' | 'info' | 'error' }[],
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const [appts, patients, invoices, staff, services, labOrders, monthlyInv] = await Promise.all([
      supabase.from('appointments').select('*, patient:patients(*), staff:staff(*), service:services(*)').eq('appointment_date', today).order('start_time'),
      supabase.from('patients').select('id, balance, status, created_at'),
      supabase.from('invoices').select('total, paid_amount, balance, created_at, status'),
      supabase.from('staff').select('id').eq('active', true),
      supabase.from('services').select('id').eq('active', true),
      supabase.from('lab_orders').select('id, status'),
      supabase.from('invoices').select('total, created_at').gte('created_at', new Date(Date.now() - 60 * 86400000).toISOString()),
    ]);

    const todayAppts = appts.data || [];
    const allPatients = patients.data || [];
    const allInvoices = invoices.data || [];
    const allStaff = staff.data || [];
    const allServices = services.data || [];
    const allLabOrders = labOrders.data || [];
    const monthlyData = monthlyInv.data || [];

    const todayRevenue = todayAppts
      .filter((a) => a.status === 'completed')
      .reduce((sum, a) => sum + (a.price || 0), 0);

    const pendingPayments = allInvoices
      .filter((i) => i.status !== 'paid')
      .reduce((sum, i) => sum + (i.balance || 0), 0);

    const completedToday = todayAppts.filter((a) => a.status === 'completed').length;
    const cancelledToday = todayAppts.filter((a) => a.status === 'cancelled').length;

    const now = new Date();
    const thisMonth = monthlyData.filter((i) => {
      const d = new Date(i.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = monthlyData.filter((i) => {
      const d = new Date(i.created_at);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });

    const monthlyRevenue = thisMonth.reduce((s, i) => s + i.total, 0);
    const lastMonthRevenue = lastMonth.reduce((s, i) => s + i.total, 0);

    // Weekly appointments (last 7 days)
    const weekDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      weekDays.push({ day: getPersianDayName(d), count: 0, amount: 0 });
      const dayAppts = await supabase
        .from('appointments')
        .select('price, status')
        .eq('appointment_date', dateStr);
      if (dayAppts.data) {
        weekDays[6 - i].count = dayAppts.data.length;
        weekDays[6 - i].amount = dayAppts.data
          .filter((a) => a.status === 'completed')
          .reduce((s, a) => s + (a.price || 0), 0);
      }
    }

    // Service distribution
    const serviceColors = ['#14b8a6', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'];
    const svcDist = allServices.slice(0, 6).map((s, i) => ({
      name: '',
      count: 0,
      color: serviceColors[i],
    }));

    // Alerts
    const alertsList: { type: string; message: string; severity: 'warning' | 'info' | 'error' }[] = [];
    if (pendingPayments > 0) {
      alertsList.push({ type: 'payment', message: `${formatCurrency(pendingPayments)} مطالبات معوق کلینیک`, severity: 'warning' });
    }
    const pendingLabOrders = allLabOrders.filter((o) => o.status === 'pending' || o.status === 'in_progress').length;
    if (pendingLabOrders > 0) {
      alertsList.push({ type: 'lab', message: `${pendingLabOrders} سفارش لابراتوار در حال پیگیری`, severity: 'info' });
    }
    const debtors = allPatients.filter((p) => p.balance > 0).length;
    if (debtors > 0) {
      alertsList.push({ type: 'debt', message: `${debtors} بیمار بدهکار دارند`, severity: 'error' });
    }

    setStats({
      todayAppointments: todayAppts.length,
      totalPatients: allPatients.length,
      todayRevenue,
      pendingPayments,
      completedToday,
      cancelledToday,
      totalStaff: allStaff.length,
      activePatients: allPatients.filter((p) => p.status === 'active').length,
      labOrders: allLabOrders.length,
      totalServices: allServices.length,
      monthlyRevenue,
      lastMonthRevenue,
      weeklyAppointments: weekDays.map((w) => w.count),
      revenueByDay: weekDays.map((w) => ({ day: w.day, amount: w.amount })),
      serviceDistribution: svcDist,
      recentAppointments: todayAppts.slice(0, 6),
      alerts: alertsList,
    });

    setLoading(false);
  }

  const maxWeekly = Math.max(...stats.weeklyAppointments, 1);
  const maxRevenue = Math.max(...stats.revenueByDay.map((d) => d.amount), 1);
  const revenueTrend = stats.lastMonthRevenue > 0
    ? Math.round(((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-surface-100 animate-pulse-soft" />
          ))}
        </div>
        <div className="h-80 bg-white rounded-2xl border border-surface-100 animate-pulse-soft" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-l from-primary-600 via-primary-500 to-secondary-500 rounded-2xl p-6 lg:p-8 shadow-elevated">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-32 -translate-y-32 blur-2xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-24 translate-y-24 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-white/80" />
            <span className="text-white/80 text-sm font-medium">خوش آمدید</span>
          </div>
          <h2 className="text-white text-xl lg:text-2xl font-bold mb-1">دکتر سارا احمدی</h2>
          <p className="text-white/70 text-sm">امروز {getPersianDayName(new Date())}، {formatNumber(today())} بیمار نوبت دارند</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <button onClick={() => onNavigate('appointments')} className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all backdrop-blur-sm">
              <CalendarDays size={16} />
              نوبت‌دهی
            </button>
            <button onClick={() => onNavigate('patients')} className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all backdrop-blur-sm">
              <Users size={16} />
              بیماران
            </button>
            <button onClick={() => onNavigate('ai')} className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all backdrop-blur-sm">
              <Sparkles size={16} />
              دستیار هوشمند
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="نوبت‌های امروز" value={formatNumber(stats.todayAppointments)} icon={CalendarDays} color="primary" delay={0} trend={stats.completedToday > 0 ? { value: `${formatNumber(stats.completedToday)} تکمیل شده`, positive: true } : undefined} />
        <StatCard title="بیماران کل" value={formatNumber(stats.totalPatients)} icon={Users} color="secondary" delay={100} />
        <StatCard title="درآمد امروز" value={formatCurrency(stats.todayRevenue)} icon={DollarSign} color="accent" delay={200} />
        <StatCard title="مطالبات معوق" value={formatCurrency(stats.pendingPayments)} icon={AlertTriangle} color="warning" delay={300} />
      </div>

      {/* Alerts */}
      {stats.alerts.length > 0 && (
        <div className="space-y-2">
          {stats.alerts.map((alert, i) => {
            const config = {
              warning: { bg: 'bg-warning-50', border: 'border-warning-200', icon: AlertTriangle, iconColor: 'text-warning-500' },
              info: { bg: 'bg-secondary-50', border: 'border-secondary-200', icon: Clock, iconColor: 'text-secondary-500' },
              error: { bg: 'bg-error-50', border: 'border-error-200', icon: AlertTriangle, iconColor: 'text-error-500' },
            };
            const c = config[alert.severity];
            const Icon = c.icon;
            return (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${c.bg} ${c.border} animate-slide-up`} style={{ animationDelay: `${i * 50}ms` }}>
                <Icon size={18} className={c.iconColor} />
                <span className="text-sm font-medium text-surface-700">{alert.message}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Appointments Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-surface-800">نوبت‌های هفته</h3>
              <p className="text-xs text-surface-400 mt-0.5">آمار ۷ روز اخیر</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Activity className="text-primary-500" size={20} />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-48">
            {stats.revenueByDay.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-lg transition-all duration-500 hover:from-primary-600 hover:to-primary-400 group relative"
                    style={{ height: `${(stats.weeklyAppointments[i] / maxWeekly) * 100}%`, minHeight: '8px' }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-surface-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatNumber(stats.weeklyAppointments[i])}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-surface-500 font-medium">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-surface-800">درآمد هفته</h3>
              <p className="text-xs text-surface-400 mt-0.5">درآمد روزانه (تومان)</p>
            </div>
            <div className="flex items-center gap-2">
              {revenueTrend !== 0 && (
                <span className={`badge ${revenueTrend > 0 ? 'bg-accent-50 text-accent-600' : 'bg-error-50 text-error-600'}`}>
                  <TrendingUp size={12} />
                  {revenueTrend > 0 ? '+' : ''}{formatNumber(revenueTrend)}%
                </span>
              )}
              <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                <DollarSign className="text-accent-500" size={20} />
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-48">
            {stats.revenueByDay.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-accent-500 to-accent-300 rounded-t-lg transition-all duration-500 hover:from-accent-600 hover:to-accent-400 group relative"
                    style={{ height: `${(day.amount / maxRevenue) * 100}%`, minHeight: '8px' }}
                  >
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-surface-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatCurrency(day.amount)}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-surface-500 font-medium">{day.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-surface-800">نوبت‌های امروز</h3>
          <button onClick={() => onNavigate('appointments')} className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
            مشاهده همه
            <ArrowLeft size={16} />
          </button>
        </div>
        {stats.recentAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mb-3">
              <CalendarDays className="text-surface-400" size={24} />
            </div>
            <p className="text-sm text-surface-400">هیچ نوبتی برای امروز ثبت نشده است</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentAppointments.map((apt) => {
              const statusConfig = {
                pending: { bg: 'bg-warning-50', text: 'text-warning-600', label: 'در انتظار', icon: Clock },
                confirmed: { bg: 'bg-secondary-50', text: 'text-secondary-600', label: 'تایید شده', icon: CheckCircle2 },
                completed: { bg: 'bg-accent-50', text: 'text-accent-600', label: 'تکمیل شده', icon: CheckCircle2 },
                cancelled: { bg: 'bg-error-50', text: 'text-error-600', label: 'لغو شده', icon: XCircle },
                no_show: { bg: 'bg-error-50', text: 'text-error-600', label: 'غیبت', icon: XCircle },
              };
              const sc = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.pending;
              const SIcon = sc.icon;
              return (
                <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {apt.patient ? apt.patient.first_name.charAt(0) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-800 text-sm truncate">
                      {apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : 'نامشخص'}
                    </p>
                    <p className="text-xs text-surface-400 truncate">
                      {apt.service?.name || 'نوبت عمومی'} • {formatTime(apt.start_time)}
                    </p>
                  </div>
                  <span className={`badge ${sc.bg} ${sc.text}`}>
                    <SIcon size={12} />
                    {sc.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function today(): number {
  return new Date().getDate();
}
