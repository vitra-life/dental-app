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
  Sparkles,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { BarChart } from '@/components/ui/bar-chart';
import { IconBox } from '@/components/ui/icon-box';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton, SkeletonList } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { appointmentStatus, statusStyle } from '@/constants/status';
import { getPersianDayName } from '@/lib/date';
import { formatCurrency, formatNumber, formatTime, fullName } from '@/lib/format';
import type { PageKey } from '@/lib/types';
import { loadDashboardStats, type DashboardAlert, type DashboardStats } from './dashboard-stats';

interface DashboardProps {
  onNavigate: (page: PageKey) => void;
}

const alertStyles: Record<DashboardAlert['severity'], { bg: string; border: string; icon: typeof Clock; iconColor: string }> = {
  warning: { bg: 'bg-warning-50', border: 'border-warning-200', icon: AlertTriangle, iconColor: 'text-warning-500' },
  info: { bg: 'bg-secondary-50', border: 'border-secondary-200', icon: Clock, iconColor: 'text-secondary-500' },
  error: { bg: 'bg-error-50', border: 'border-error-200', icon: AlertTriangle, iconColor: 'text-error-500' },
};

export function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    setStats(loadDashboardStats());
  }, []);

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonList count={4} className="h-32" />
        </div>
        <Skeleton className="h-80" />
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
          <p className="text-white/70 text-sm">امروز {getPersianDayName(new Date())}، {formatNumber(stats.todayAppointments)} بیمار نوبت دارند</p>
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
            const c = alertStyles[alert.severity];
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
        <div className="card p-6">
          <SectionHeader title="نوبت‌های هفته" subtitle="آمار ۷ روز اخیر" icon={Activity} tone="primary" />
          <BarChart
            tone="primary"
            className="gap-2 h-48"
            bars={stats.week.map((d) => ({ label: d.day, value: d.count, tooltip: formatNumber(d.count) }))}
          />
        </div>

        <div className="card p-6">
          <SectionHeader
            title="درآمد هفته"
            subtitle="درآمد روزانه (تومان)"
            icon={DollarSign}
            tone="accent"
            aside={
              <div className="flex items-center gap-2">
                {stats.revenueTrend !== 0 && (
                  <span className={`badge ${stats.revenueTrend > 0 ? 'bg-accent-50 text-accent-600' : 'bg-error-50 text-error-600'}`}>
                    <TrendingUp size={12} />
                    {stats.revenueTrend > 0 ? '+' : ''}{formatNumber(stats.revenueTrend)}%
                  </span>
                )}
                <IconBox icon={DollarSign} tone="accent" />
              </div>
            }
          />
          <BarChart
            tone="accent"
            className="gap-2 h-48"
            compactTooltip
            bars={stats.week.map((d) => ({ label: d.day, value: d.revenue, tooltip: formatCurrency(d.revenue) }))}
          />
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
            {stats.recentAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
                <Avatar className="w-11 h-11 rounded-xl text-sm">{apt.patient ? apt.patient.first_name.charAt(0) : '?'}</Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-800 text-sm truncate">{fullName(apt.patient)}</p>
                  <p className="text-xs text-surface-400 truncate">
                    {apt.service?.name || 'نوبت عمومی'} • {formatTime(apt.start_time)}
                  </p>
                </div>
                <StatusBadge status={statusStyle(appointmentStatus, apt.status, 'pending')} showIcon />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
