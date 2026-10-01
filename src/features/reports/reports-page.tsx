import { useState, useEffect } from 'react';
import { Activity, Award, BarChart3, CalendarDays, DollarSign, TrendingUp, Users } from 'lucide-react';
import { BarChart } from '@/components/ui/bar-chart';
import { PageHeader } from '@/components/ui/page-header';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton, SkeletonList } from '@/components/ui/skeleton';
import { formatCurrency, formatNumber, percent } from '@/lib/format';
import { loadReportStats, type ReportStats } from './report-stats';

const summaryColors = {
  accent: 'bg-accent-50 text-accent-500',
  secondary: 'bg-secondary-50 text-secondary-500',
  primary: 'bg-primary-50 text-primary-500',
  warning: 'bg-warning-50 text-warning-500',
};

// Circumference of the completion ring (r = 52 in a 120×120 viewBox).
const RING = 327;

export function Reports() {
  const [data, setData] = useState<ReportStats | null>(null);

  useEffect(() => {
    setData(loadReportStats());
  }, []);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonList count={4} className="h-32" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const completionRate = percent(data.completedAppointments, data.totalAppointments);
  const maxServiceCount = Math.max(...data.serviceStats.map((s) => s.count), 1);
  const maxStaffAppointments = Math.max(...data.staffStats.map((s) => s.appointments), 1);

  const summary = [
    { label: 'درآمد کل', value: formatCurrency(data.totalRevenue), icon: DollarSign, color: 'accent' as const },
    { label: 'بیماران', value: formatNumber(data.totalPatients), icon: Users, color: 'secondary' as const },
    { label: 'نوبت‌ها', value: formatNumber(data.totalAppointments), icon: CalendarDays, color: 'primary' as const },
    { label: 'مطالبات', value: formatCurrency(data.pendingPayments), icon: TrendingUp, color: 'warning' as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="گزارش‌ها" subtitle="تحلیل عملکرد کلینیک" />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-surface-500 mb-2">{stat.label}</p>
                  <p className="text-lg font-bold text-surface-800">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${summaryColors[stat.color]}`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="card p-6">
        <SectionHeader title="درآمد ماهانه" subtitle="۶ ماه اخیر" icon={BarChart3} tone="accent" />
        <BarChart
          tone="accent"
          className="gap-2 lg:gap-4 h-56"
          minHeight={12}
          compactTooltip
          bars={data.monthlyRevenue.map((m) => ({ label: m.month, value: m.amount, tooltip: formatCurrency(m.amount) }))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Appointments */}
        <div className="card p-6">
          <SectionHeader title="نوبت‌های هفته" subtitle="آمار هفتگی" icon={Activity} tone="primary" />
          <BarChart
            tone="primary"
            className="gap-2 h-40"
            bars={data.weeklyAppointments.map((w) => ({ label: w.day, value: w.count, tooltip: formatNumber(w.count) }))}
          />
        </div>

        {/* Completion Rate */}
        <div className="card p-6">
          <SectionHeader title="نرخ تکمیل درمان" subtitle="درصد نوبت‌های تکمیل شده" icon={Award} tone="accent" />
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="#22c55e" strokeWidth="10"
                  strokeDasharray={`${(completionRate / 100) * RING} ${RING}`}
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
        <SectionHeader title="پرکاربردترین خدمات" subtitle="آمار خدمات ارائه شده" icon={Award} tone="secondary" />
        <div className="space-y-3">
          {data.serviceStats.map((svc, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-surface-700 truncate">{svc.name}</span>
                  <span className="text-xs text-surface-400">{formatNumber(svc.count)} بار</span>
                </div>
                <ProgressBar value={(svc.count / maxServiceCount) * 100} slow />
              </div>
              <span className="text-xs font-medium text-surface-600 whitespace-nowrap">{formatCurrency(svc.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Performance */}
      <div className="card p-6">
        <SectionHeader title="عملکرد دندانپزشکان" subtitle="تعداد نوبت‌های هر پزشک" icon={Users} tone="primary" />
        <div className="space-y-3">
          {data.staffStats.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: s.color }}>
                {s.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-surface-700">{s.name}</span>
                  <span className="text-xs text-surface-400">{formatNumber(s.appointments)} نوبت</span>
                </div>
                <ProgressBar value={(s.appointments / maxStaffAppointments) * 100} color={s.color} slow />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
