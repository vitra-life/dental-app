import { AlertTriangle, ArrowLeft, CalendarDays, CircleDollarSign, ClipboardList, Clock, Plus, Receipt, Sparkles, Users, type LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { AreaTrend, Bars, Donut } from '@/components/ui/charts';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton, SkeletonList } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusBadge } from '@/components/ui/status-badge';
import { serviceCategoryLabel } from '@/constants/service-categories';
import { appointmentStatus, statusStyle } from '@/constants/status';
import { formatDate, getPersianDayName, todayISO } from '@/lib/date';
import { formatCurrency, formatNumber, formatTime, fullName, percent } from '@/lib/format';
import type { PageKey } from '@/lib/types';
import { LoadError } from '@/components/ui/load-error';
import { useClinicData } from '@/data/clinic-data';
import { loadDashboardStats, type DashboardStats } from './dashboard-stats';

interface DashboardProps {
  onNavigate: (page: PageKey) => void;
  onOpenPatient: (patientId: string) => void;
}

interface AssistantNote {
  icon: LucideIcon;
  /** Card border and icon tile colours. */
  border: string;
  tile: string;
  title: string;
  description: string;
  cta: string;
  page: PageKey;
}

function assistantNotes(stats: DashboardStats): AssistantNote[] {
  return [
    {
      icon: ClipboardList,
      border: 'border-warning-200',
      tile: 'bg-warning-100 text-warning-600',
      title: `${formatNumber(stats.unfinishedPlans)} طرح درمان ناتمام`,
      description: `ارزش تقریبی: ${formatCurrency(stats.unfinishedPlanValue)}`,
      cta: 'مشاهده بیماران',
      page: 'patients',
    },
    {
      icon: AlertTriangle,
      border: 'border-error-200',
      tile: 'bg-error-100 text-error-600',
      title: `${formatNumber(stats.debtors)} بیمار بدهکار`,
      description: `مجموع: ${formatCurrency(stats.totalDebt)}`,
      cta: 'مشاهده صورتحساب',
      page: 'billing',
    },
    {
      icon: Clock,
      border: 'border-primary-200',
      tile: 'bg-primary-100 text-primary-600',
      title: `${formatNumber(stats.freeSlotsToday)} ساعت خالی امروز`,
      description: 'می‌توان با بیماران در انتظار پر کرد',
      cta: 'مدیریت نوبت‌ها',
      page: 'appointments',
    },
  ];
}

export function Dashboard({ onNavigate, onOpenPatient }: DashboardProps) {
  const { data, error, refetch } = useClinicData();
  const stats = data ? loadDashboardStats(data) : null;

  if (!stats && error) return <LoadError error={error} onRetry={refetch} />;

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <SkeletonList count={4} className="h-24" />
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const today = todayISO();
  const notes = assistantNotes(stats);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900">داشبورد</h1>
          <p className="text-sm text-surface-500 mt-0.5">{getPersianDayName(today)}، {formatDate(today)}</p>
        </div>
        <button onClick={() => onNavigate('appointments')} className="btn-primary">
          <Plus size={16} />
          نوبت جدید
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatTile label="نوبت‌های امروز" value={formatNumber(stats.todayAppointments)} sub={<>{formatNumber(stats.confirmedToday)} تأیید شده</>} icon={CalendarDays} tone="primary" />
        <StatTile label="کل بیماران" value={formatNumber(stats.totalPatients)} sub={<>{formatNumber(stats.activePatients)} فعال</>} icon={Users} tone="violet" />
        <StatTile label="دریافتی این ماه" value={formatCurrency(stats.monthReceived)} sub={stats.monthLabel} icon={CircleDollarSign} tone="accent" />
        <StatTile label="مانده دریافتنی" value={formatCurrency(stats.pendingPayments)} sub={<>{formatNumber(stats.openInvoices)} فاکتور</>} icon={Receipt} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <SectionHeader title="درآمد ماهانه (تومان)" note="۶ ماه اخیر" />
          <AreaTrend data={stats.monthlyRevenue.map((m) => ({ label: m.month, value: m.amount }))} height={200} format={formatCurrency} />
        </div>

        <div className="card p-5">
          <SectionHeader title="توزیع خدمات" aside={<span className="text-xs text-surface-400">۳۰ روز اخیر</span>} />
          {stats.serviceShare.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-10">نوبتی در این بازه ثبت نشده است</p>
          ) : (
            <Donut data={stats.serviceShare.map((s) => ({ label: serviceCategoryLabel(s.category), value: s.count }))} height={160} format={(v) => `${formatNumber(v)} نوبت`} legendLimit={4} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 card p-5">
          <SectionHeader
            title="نوبت‌های امروز"
            aside={<button onClick={() => onNavigate('appointments')} className="text-xs text-primary-600 hover:text-primary-700 font-medium">مشاهده همه</button>}
          />
          {stats.todayList.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-6">نوبتی برای امروز ثبت نشده</p>
          ) : (
            <div className="space-y-2">
              {stats.todayList.map((apt) => (
                <div key={apt.id} onClick={() => onOpenPatient(apt.patient_id)} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors cursor-pointer">
                  <Avatar className="w-9 h-9 rounded-full text-sm shrink-0">{apt.patient ? apt.patient.first_name.charAt(0) : '?'}</Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{fullName(apt.patient)}</p>
                    <p className="text-xs text-surface-500 truncate">{apt.service?.name || 'نوبت عمومی'}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-xs font-medium text-surface-700 mb-1">{formatTime(apt.start_time)}</p>
                    <StatusBadge status={statusStyle(appointmentStatus, apt.status, 'pending')} className="px-2 py-0.5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 card p-5">
          <SectionHeader title="نوبت‌های هفتگی" />
          <Bars data={stats.week.map((d) => ({ label: d.day, value: d.count }))} height={180} format={(v) => `${formatNumber(v)} نوبت`} barSize={16} />
          <div className="mt-3 pt-3 border-t border-surface-100">
            <h3 className="text-xs font-semibold text-surface-600 mb-2">طرح‌های درمان فعال</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-surface-800">{formatNumber(stats.activePlans)}</span>
              <button onClick={() => onNavigate('patients')} className="text-xs text-primary-600 hover:underline">مشاهده</button>
            </div>
            <ProgressBar value={percent(stats.activePlans, stats.totalPatients)} />
          </div>
        </div>
      </div>

      {/* What the assistant has noticed */}
      <div className="bg-linear-to-l/srgb from-violet-50 to-primary-50 border border-violet-100 rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br/srgb from-violet-500 to-primary-500 flex items-center justify-center shadow-sm">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-surface-800">دستیار هوشمند</h2>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse" />
                <p className="text-xs text-surface-500">{formatNumber(notes.length)} هشدار مهم</p>
              </div>
            </div>
          </div>
          <button onClick={() => onNavigate('ai')} className="text-xs bg-white border border-violet-200 text-violet-700 px-3 py-1.5 rounded-xl hover:bg-violet-50 transition-colors font-medium">
            باز کردن دستیار
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {notes.map((note) => (
            <div key={note.title} className={`bg-white rounded-xl border p-3.5 ${note.border}`}>
              <div className="flex items-start gap-2.5">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${note.tile}`}>
                  <note.icon size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-surface-800 leading-tight">{note.title}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{note.description}</p>
                  <button onClick={() => onNavigate(note.page)} className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-1 font-medium">
                    {note.cta}
                    <ArrowLeft size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
